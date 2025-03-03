
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Only pass the basic information for the first step
      const { error, success, user } = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      if (success && user) {
        // Store user info in session storage temporarily to use in onboarding
        sessionStorage.setItem('tempUser', JSON.stringify({
          id: user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }));
        
        // Navigate to onboarding page with the temp user data
        navigate('/onboarding');
      } else if (error) {
        console.error('Detailed signup error:', error);
        toast.error('Failed to create account', {
          description: error.message || 'Please check your information and try again.'
        });
      }
    } catch (err: any) {
      console.error('Signup error details:', err);
      toast.error('Connection error', {
        description: 'Unable to connect to authentication service. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Create your account" 
          subtitle="Sign up to start creating wellbeing surveys for your staff"
        />
        <div className="mb-4 text-sm text-gray-600 rounded-lg p-2 bg-blue-50 border border-blue-100">
          <p>Please make sure you have internet connectivity to create an account.</p>
        </div>
        <AuthForm mode="signup" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default SignUp;
