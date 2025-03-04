
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check for email confirmation success in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('email_confirmed') === 'true') {
      toast.success('Email confirmed successfully!', {
        description: 'You can now log in to your account.'
      });
    }
  }, [location]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const { error, success } = await signIn(data.email, data.password);
      
      if (success) {
        // Redirect to the dashboard page after successful login
        navigate('/dashboard');
      } else if (error) {
        toast.error('Failed to log in', {
          description: error.message || 'Please check your credentials and try again.'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
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
          title="Welcome back" 
          subtitle="Log in to access your surveys and analytics"
          alignment="center"
        />
        <AuthForm mode="login" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default Login;
