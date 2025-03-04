
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingForm } from '../hooks/useOnboardingForm';
import JobTitleInput from '../components/onboarding/JobTitleInput';
import SchoolSearch from '../components/onboarding/SchoolSearch';
import CustomSchoolForm from '../components/onboarding/CustomSchoolForm';
import SubmitButton from '../components/onboarding/SubmitButton';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    prefillSocialLoginData
  } = useOnboardingForm();

  useEffect(() => {
    // Redirect to dashboard if no user is found
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if this is a social login user and prefill data if available
    if (user.app_metadata?.provider && (user.user_metadata?.name || user.user_metadata?.full_name)) {
      prefillSocialLoginData(user);
    }
  }, [user, navigate, prefillSocialLoginData]);

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

  // Determine if the user came from social login
  const isSocialLoginUser = user?.app_metadata?.provider && user.app_metadata.provider !== 'email';

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Complete your profile" 
          subtitle={isSocialLoginUser 
            ? `Welcome! Please provide some additional information to complete your account setup.`
            : "Tell us about your school to finish setting up your account"
          }
        />
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 animate-slide-up">
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
