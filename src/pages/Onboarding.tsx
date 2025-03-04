
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingForm } from '../hooks/useOnboardingForm';
import JobTitleInput from '../components/onboarding/JobTitleInput';
import SchoolSearch from '../components/onboarding/SchoolSearch';
import CustomSchoolForm from '../components/onboarding/CustomSchoolForm';
import SubmitButton from '../components/onboarding/SubmitButton';
import { toast } from 'sonner';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNewSocialUser, setIsNewSocialUser] = useState(false);
  
  const {
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
    handleSubmit,
    setSearchQuery,
    setFormData
  } = useOnboardingForm();

  useEffect(() => {
    // Redirect to login if no user is found
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if user is coming from social login and has no profile
    const checkUserProfile = async () => {
      try {
        // Check if user has profile data in metadata
        const hasCompletedProfile = user.user_metadata?.school_name || user.user_metadata?.job_title;
        
        // If user is from social login (has provider) and hasn't completed profile
        if (user.app_metadata?.provider && !hasCompletedProfile) {
          setIsNewSocialUser(true);
          
          // Pre-fill name if available from social provider
          if (user.user_metadata?.full_name || user.user_metadata?.name) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            toast.info('Please complete your profile information', {
              description: 'We need a few more details to set up your account.'
            });
            
            // Set the name in form data if available
            setFormData(prev => ({
              ...prev,
              firstName: firstName,
              lastName: lastName
            }));
          }
        } else if (hasCompletedProfile) {
          // If user already has a profile, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };
    
    checkUserProfile();
  }, [user, navigate, setFormData]);

  const selectedSchool = formData.schoolName && formData.schoolAddress 
    ? { name: formData.schoolName, address: formData.schoolAddress } 
    : null;

  const resetSelectedSchool = () => {
    handleChange({
      target: { name: 'schoolName', value: '' }
    } as React.ChangeEvent<HTMLInputElement>);
    
    handleChange({
      target: { name: 'schoolAddress', value: '' }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Complete your profile" 
          subtitle="Tell us about your school to finish setting up your account"
        />
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 animate-slide-up">
          {isNewSocialUser && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                Welcome! Please complete your profile information to continue setting up your account.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <JobTitleInput 
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isLoading}
            />
            
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
            
            <div>
              <SubmitButton isLoading={isLoading} />
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Onboarding;
