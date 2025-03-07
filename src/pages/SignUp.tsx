
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // First check if user exists using our edge function
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-user-exists', {
        body: { email: data.email }
      });
      
      if (checkError) {
        console.error('Error checking if user exists:', checkError);
      }
      
      // If user exists, show error and redirect to login
      if (checkData && checkData.exists) {
        toast.error('Email already registered', {
          description: 'This email address is already associated with an account. Please try logging in instead.'
        });
        setTimeout(() => navigate('/login'), 1000);
        setIsLoading(false);
        return;
      }
      
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
        
        // Navigate to email confirmation page instead of onboarding
        navigate('/email-confirmation', { 
          state: { email: data.email } 
        });
      } else if (error) {
        console.error('Detailed signup error:', error);
        
        // Improved error message for email already in use
        if (error.message && (
            error.message.includes('already registered') || 
            error.message.includes('already in use') ||
            error.message.includes('already exists')
          )) {
          toast.error('Email already registered', {
            description: 'This email address is already associated with an account. Please try logging in instead.'
          });
          setTimeout(() => navigate('/login'), 1000);
        } else {
          toast.error('Failed to create account', {
            description: error.message || 'Please check your information and try again.'
          });
        }
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
