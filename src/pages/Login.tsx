
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const { error, success } = await signIn(data.email, data.password);
      
      if (success) {
        // If there's a redirect path from an invitation link, go there
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/dashboard');
        }
      } else if (error) {
        if (error.message.includes('Email not confirmed')) {
          navigate('/email-confirmation', { state: { email: data.email } });
        } else {
          toast.error('Login failed', {
            description: error.message || 'Please check your credentials and try again.'
          });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
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
          title="Welcome back" 
          subtitle="Log in to access your wellbeing surveys"
        />
        {redirectPath && (
          <div className="mb-4 text-sm text-green-600 rounded-lg p-2 bg-green-50 border border-green-100">
            <p>You'll be redirected to complete your invitation after logging in.</p>
          </div>
        )}
        <AuthForm mode="login" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default Login;
