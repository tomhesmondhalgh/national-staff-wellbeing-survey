
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';

const EmailConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  
  const handleContinue = () => {
    // Check if there's a redirect stored from an invitation
    const redirectPath = sessionStorage.getItem('authRedirect');
    if (redirectPath) {
      sessionStorage.removeItem('authRedirect');
      navigate(redirectPath);
    } else {
      navigate('/onboarding');
    }
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-brandPurple-600 mb-4">Check Your Email</h1>
          
          <p className="text-gray-700 mb-6">
            We've sent a confirmation link to:
            <br />
            <span className="font-semibold">{email || 'your email address'}</span>
          </p>
          
          <p className="text-gray-600 mb-6 text-sm">
            Please check your inbox and click the confirmation link to complete your registration.
            If you don't see it, please check your spam folder.
          </p>
          
          <Button 
            onClick={handleContinue}
            className="w-full bg-brandPurple-500 hover:bg-brandPurple-600 mb-4"
          >
            I've Confirmed My Email
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmailConfirmation;
