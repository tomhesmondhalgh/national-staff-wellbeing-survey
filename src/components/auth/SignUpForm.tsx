import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import SchoolSearch from '../onboarding/SchoolSearch';
import CustomSchoolForm from '../onboarding/CustomSchoolForm';
import { SchoolSearchResult } from '../../hooks/useOnboardingForm';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  jobTitle: string;
  schoolName: string;
  customStreetAddress: string;
  customStreetAddress2: string;
  customCity: string;
  customCounty: string;
  customPostalCode: string;
  customCountry: string;
  schoolAddress: string;
}

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => void;
  isLoading?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [useCustomSchool, setUseCustomSchool] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 5;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useCustomSchool) {
      const schoolAddress = compileCustomAddress();
      const updatedFormData = {
        ...formData,
        schoolAddress
      };
      onSubmit(updatedFormData);
    } else {
      onSubmit(formData);
    }
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
        schoolAddress: ''
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
  
  const selectedSchool = formData.schoolName && formData.schoolAddress 
    ? { name: formData.schoolName, address: formData.schoolAddress } 
    : null;
    
  const resetSelectedSchool = () => {
    setFormData(prev => ({
      ...prev,
      schoolName: '',
      schoolAddress: ''
    }));
  };

  return (
    <div className="max-w-2xl w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">
        Create your account
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="form-input w-full"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last name
            </label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="form-input w-full"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-input w-full"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="form-input w-full"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Professional details</h3>
          
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Job title
            </label>
            <Input
              id="jobTitle"
              name="jobTitle"
              type="text"
              required
              className="form-input w-full"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">School/College details</h4>
            
            {!useCustomSchool ? (
              <SchoolSearch 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searching={searching}
                searchResults={searchResults}
                currentPage={currentPage}
                totalResults={totalResults}
                resultsPerPage={resultsPerPage}
                handleSearchSchool={handleSearchSchool}
                handlePageChange={handlePageChange}
                selectSchool={selectSchool}
                toggleCustomSchool={toggleCustomSchool}
                selectedSchool={selectedSchool}
                onChangeSchool={resetSelectedSchool}
              />
            ) : (
              <CustomSchoolForm 
                formData={formData}
                onChange={handleChange}
                onToggleCustomSchool={toggleCustomSchool}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            className="btn-primary w-full mt-4 flex justify-center items-center" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>Create Account</>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-brandPurple-600 hover:text-brandPurple-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
