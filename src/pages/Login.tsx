
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    console.log('Login data:', data);
    // In a real application, you would authenticate the user here
    // For now, we'll just redirect to the dashboard
    navigate('/dashboard');
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Welcome back" 
          subtitle="Log in to access your surveys and analytics"
        />
        <AuthForm mode="login" onSubmit={handleSubmit} />
      </div>
    </MainLayout>
  );
};

export default Login;
