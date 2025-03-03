
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
      const { error, success } = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress,
      });
      
      if (success) {
        toast.success('Account created successfully!');
        navigate('/login');
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
