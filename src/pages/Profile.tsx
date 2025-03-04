import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import Pagination from '../components/surveys/Pagination';

type SchoolSearchResult = {
  URN: number;
  EstablishmentName: string;
  Postcode: string;
  Street: string;
  Town: string;
  County: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, completeUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [useCustomSchool, setUseCustomSchool] = useState(false);
  
  const [profileData, setProfileData] = useState({
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 5;
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setProfileData(prev => ({
            ...prev,
            jobTitle: data.job_title || '',
            schoolName: data.school_name || '',
            schoolAddress: data.school_address || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
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
    
    setProfileData({
      ...profileData,
      schoolName: school.EstablishmentName,
      schoolAddress: address,
    });
    
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const toggleCustomSchool = () => {
    setUseCustomSchool(!useCustomSchool);
    if (!useCustomSchool) {
      setProfileData(prev => ({
        ...prev,
        schoolName: '',
        schoolAddress: '',
      }));
    } else {
      setProfileData(prev => ({
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
      profileData.customStreetAddress,
      profileData.customStreetAddress2,
      profileData.customCity,
      profileData.customCounty,
      profileData.customPostalCode,
      profileData.customCountry,
    ].filter(Boolean);
    
    return addressParts.join(', ');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    if (!profileData.jobTitle) {
      toast.error('Please enter your job title');
      return;
    }
    
    if (useCustomSchool) {
      if (!profileData.customStreetAddress || !profileData.customCity || !profileData.customPostalCode) {
        toast.error('Please fill in all required address fields');
        return;
      }
      
      const customAddress = compileCustomAddress();
      
      setProfileData(prev => ({
        ...prev,
        schoolAddress: customAddress,
        schoolName: 'Custom: ' + (profileData.schoolName || profileData.customCity),
      }));
    } else if (!profileData.schoolName || !profileData.schoolAddress) {
      toast.error('Please select a school or enter a custom school');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const userData = {
        jobTitle: profileData.jobTitle,
        schoolName: useCustomSchool ? 'Custom: ' + (profileData.schoolName || profileData.customCity) : profileData.schoolName,
        schoolAddress: useCustomSchool ? compileCustomAddress() : profileData.schoolAddress,
        email: user.email,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
      };
      
      const { error, success } = await completeUserProfile(user.id, userData);
      
      if (success) {
        toast.success('Profile updated successfully!');
        navigate('/dashboard');
      } else if (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to update profile', {
          description: error.message || 'Please check your information and try again.'
        });
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error('Error updating profile', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 size={40} className="animate-spin text-brandPurple-500" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Your Profile" 
          subtitle="Manage your personal and school information"
          alignment="center"
        />
        
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                value={profileData.jobTitle}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
            
            {!useCustomSchool ? (
              <>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School/College
                  </label>
                  
                  {profileData.schoolName && profileData.schoolAddress ? (
                    <div className="p-4 border rounded-md bg-gray-50">
                      <p className="font-medium">{profileData.schoolName}</p>
                      <p className="text-sm text-gray-600 mt-1">{profileData.schoolAddress}</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            schoolName: '',
                            schoolAddress: ''
                          }));
                        }}
                      >
                        Change School
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Search by school name or postcode"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchSchool();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          onClick={() => handleSearchSchool()} 
                          disabled={searching || !searchQuery.trim()}
                        >
                          {searching ? (
                            <Loader2 size={18} className="animate-spin mr-2" />
                          ) : (
                            <Search size={18} className="mr-2" />
                          )}
                          Search
                        </Button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-4">
                          <div className="border rounded-md overflow-hidden divide-y">
                            {searchResults.map((school, index) => (
                              <div 
                                key={`${school.URN}-${index}`} 
                                className="p-3 hover:bg-gray-50 cursor-pointer"
                                onClick={() => selectSchool(school)}
                              >
                                <p className="font-medium">{school.EstablishmentName}</p>
                                <p className="text-sm text-gray-600">{school.Postcode}</p>
                              </div>
                            ))}
                          </div>
                          
                          {totalResults > resultsPerPage && (
                            <div className="mt-4">
                              <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(totalResults / resultsPerPage)}
                                onPageChange={handlePageChange}
                              />
                              <p className="text-xs text-center text-gray-500 mt-2">
                                Showing {searchResults.length} of {totalResults} results
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {searchQuery && searchResults.length === 0 && !searching && (
                        <p className="text-sm text-gray-600">No schools found matching your search.</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={toggleCustomSchool}
                    className="w-full"
                  >
                    My School/College is not listed
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    School/College name
                  </label>
                  <Input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    required
                    className="form-input w-full"
                    value={profileData.schoolName}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                
                <div>
                  <label htmlFor="customStreetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Street address
                  </label>
                  <Input
                    id="customStreetAddress"
                    name="customStreetAddress"
                    type="text"
                    required
                    className="form-input w-full"
                    value={profileData.customStreetAddress}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                
                <div>
                  <label htmlFor="customStreetAddress2" className="block text-sm font-medium text-gray-700 mb-1">
                    Street address 2 (optional)
                  </label>
                  <Input
                    id="customStreetAddress2"
                    name="customStreetAddress2"
                    type="text"
                    className="form-input w-full"
                    value={profileData.customStreetAddress2}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customCity" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Input
                      id="customCity"
                      name="customCity"
                      type="text"
                      required
                      className="form-input w-full"
                      value={profileData.customCity}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customCounty" className="block text-sm font-medium text-gray-700 mb-1">
                      County (optional)
                    </label>
                    <Input
                      id="customCounty"
                      name="customCounty"
                      type="text"
                      className="form-input w-full"
                      value={profileData.customCounty}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal code
                    </label>
                    <Input
                      id="customPostalCode"
                      name="customPostalCode"
                      type="text"
                      required
                      className="form-input w-full"
                      value={profileData.customPostalCode}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customCountry" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <Input
                      id="customCountry"
                      name="customCountry"
                      type="text"
                      required
                      className="form-input w-full"
                      value={profileData.customCountry}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={toggleCustomSchool}
                    className="w-full"
                  >
                    Back to school search
                  </Button>
                </div>
              </>
            )}
            
            <div>
              <Button 
                type="submit" 
                className="btn-primary w-full mt-4 flex justify-center items-center" 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Saving profile...
                  </>
                ) : (
                  <>Save profile</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
