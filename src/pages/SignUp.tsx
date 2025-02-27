
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
        toast.success('Account created successfully!', {
          description: 'Please check your email to confirm your account.'
        });
        navigate('/login');
      } else if (error) {
        toast.error('Failed to create account', {
          description: error.message || 'Please check your information and try again.'
        });
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('Something went wrong', {
        description: 'Please try again later.'
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
        <AuthForm mode="signup" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default SignUp;
