
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export type SchoolSearchResult = {
  URN: number;
  EstablishmentName: string;
  Postcode: string;
  Street: string;
  Town: string;
  County: string;
};

export type OnboardingFormData = {
  jobTitle: string;
  schoolName: string;
  schoolAddress: string;
  customStreetAddress: string;
  customStreetAddress2: string;
  customCity: string;
  customCounty: string;
  customPostalCode: string;
  customCountry: string;
};

export const useOnboardingForm = () => {
  const navigate = useNavigate();
  const { user, completeUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [useCustomSchool, setUseCustomSchool] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 5;
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    jobTitle: '',
    schoolName: '',
    schoolAddress: '',
    customStreetAddress: '',
    customStreetAddress2: '',
    customCity: '',
    customCounty: '',
    customPostalCode: '',
    customCountry: 'United Kingdom',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSchool = async (page = 1) => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    setCurrentPage(page);
    
    try {
      console.log('Searching for schools with query:', searchQuery);
      
      const countQuery = await supabase
        .from('schools')
        .select('URN', { count: 'exact', head: true })
        .or(`EstablishmentName.ilike.%${searchQuery.trim()}%,Postcode.ilike.%${searchQuery.trim()}%`);
      
      const totalCount = countQuery.count || 0;
      setTotalResults(totalCount);
      
      const from = (page - 1) * resultsPerPage;
      const to = from + resultsPerPage - 1;
      
      const { data, error } = await supabase
        .from('schools')
        .select('URN, EstablishmentName, Postcode, Street, Town, "County (name)"')
        .or(`EstablishmentName.ilike.%${searchQuery.trim()}%,Postcode.ilike.%${searchQuery.trim()}%`)
        .range(from, to);
      
      console.log('Search results:', data);
      console.log('Total results:', totalCount);
      
      if (error) {
        console.error('Error searching schools:', error);
        toast.error('Error searching for schools');
      } else if (data && data.length > 0) {
        const formattedResults = data.map(school => ({
          URN: school.URN,
          EstablishmentName: school.EstablishmentName,
          Postcode: school.Postcode,
          Street: school.Street || '',
          Town: school.Town || '',
          County: school["County (name)"] || '',
        }));
        setSearchResults(formattedResults);
      } else {
        toast.info('No schools found matching your search term');
        console.log('No schools found matching:', searchQuery);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search for schools');
    } finally {
      setSearching(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    handleSearchSchool(page);
  };
  
  const selectSchool = (school: SchoolSearchResult) => {
    const address = [
      school.Street,
      school.Town,
      school.County,
      school.Postcode
    ].filter(Boolean).join(', ');
    
    setFormData({
      ...formData,
      schoolName: school.EstablishmentName,
      schoolAddress: address,
    });
    
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const toggleCustomSchool = () => {
    setUseCustomSchool(!useCustomSchool);
    if (!useCustomSchool) {
      setFormData(prev => ({
        ...prev,
        schoolName: '',
        schoolAddress: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customStreetAddress: '',
        customStreetAddress2: '',
        customCity: '',
        customCounty: '',
        customPostalCode: '',
        customCountry: 'United Kingdom',
      }));
    }
  };
  
  const compileCustomAddress = () => {
    const addressParts = [
      formData.customStreetAddress,
      formData.customStreetAddress2,
      formData.customCity,
      formData.customCounty,
      formData.customPostalCode,
      formData.customCountry,
    ].filter(Boolean);
    
    return addressParts.join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error('No user found. Please log in again.');
      navigate('/login');
      return;
    }

    if (!formData.jobTitle) {
      toast.error('Please enter your job title');
      setIsLoading(false);
      return;
    }
    
    if (useCustomSchool) {
      if (!formData.customStreetAddress || !formData.customCity || !formData.customPostalCode) {
        toast.error('Please fill in all required address fields');
        setIsLoading(false);
        return;
      }
      
      const customAddress = compileCustomAddress();
      
      setFormData(prev => ({
        ...prev,
        schoolAddress: customAddress,
        schoolName: 'Custom: ' + (formData.schoolName || formData.customCity),
      }));
    } else if (!formData.schoolName || !formData.schoolAddress) {
      toast.error('Please select a school or enter a custom school');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        jobTitle: formData.jobTitle,
        schoolName: useCustomSchool ? 'Custom: ' + (formData.schoolName || formData.customCity) : formData.schoolName,
        schoolAddress: useCustomSchool ? compileCustomAddress() : formData.schoolAddress,
        email: user.email,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
      };

      const { error, success } = await completeUserProfile(user.id, userData);

      if (success) {
        toast.success('Profile completed successfully!');
        // Redirect to profile page
        navigate('/profile');
      } else if (error) {
        console.error('Error completing profile:', error);
        toast.error('Failed to complete profile', {
          description: error.message || 'Please check your information and try again.'
        });
      }
    } catch (err: any) {
      console.error('Profile completion error:', err);
      toast.error('Error completing profile', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    searchQuery,
    searchResults,
    searching,
    useCustomSchool,
    currentPage,
    totalResults,
    resultsPerPage,
    handleChange,
    handleSearchSchool,
    handlePageChange,
    selectSchool,
    toggleCustomSchool,
    compileCustomAddress,
    handleSubmit,
    setSearchQuery
  };
};
