
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';

const SignUp = () => {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    console.log('Signup data:', data);
    // In a real application, you would register the user here
    // For now, we'll just redirect to the dashboard
    navigate('/dashboard');
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Create your account" 
          subtitle="Sign up to start creating wellbeing surveys for your staff"
        />
        <AuthForm mode="signup" onSubmit={handleSubmit} />
      </div>
    </MainLayout>
  );
};

export default SignUp;
