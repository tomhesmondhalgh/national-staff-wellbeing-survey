
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
  const { signIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Extract returnTo path from URL if present
  const getReturnPath = () => {
    const params = new URLSearchParams(location.search);
    const returnPath = params.get('returnTo');
    // Handle invitation redirect special case
    if (returnPath && returnPath.includes('/invitation/accept')) {
      return returnPath;
    }
    return returnPath || '/dashboard';
  };

  // Check if we're coming from an invitation
  const isFromInvitation = () => {
    const returnPath = getReturnPath();
    return returnPath.includes('/invitation/accept');
  };

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate(getReturnPath());
    }
  }, [user, navigate, location.search]);

  // Check for email confirmation success, password reset, or password reset success in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.get('email_confirmed') === 'true') {
      toast.success('Email confirmed successfully!', {
        description: 'You can now log in to your account.'
      });
    }
    
    if (params.get('email_reset') === 'true') {
      toast.success('Password reset email sent!', {
        description: 'Please check your inbox for instructions to reset your password.'
      });
    }
    
    if (params.get('password_reset') === 'true') {
      toast.success('Password reset successfully!', {
        description: 'You can now log in with your new password.'
      });
    }
  }, [location]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const { error, success } = await signIn(data.email, data.password);
      
      if (success) {
        // Redirect to the return path or dashboard after successful login
        navigate(getReturnPath());
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
          title={isFromInvitation() ? "Log in to accept invitation" : "Welcome back"} 
          subtitle={isFromInvitation() 
            ? "Log in to your account to accept the organization invitation" 
            : "Log in to access your surveys and analytics"
          }
          alignment="center"
        />
        <AuthForm mode="login" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default Login;
