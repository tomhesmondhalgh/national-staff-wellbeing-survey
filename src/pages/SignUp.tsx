
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase/client';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  // Extract invitation token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('invitation');
    
    if (token) {
      setInvitationToken(token);
      fetchInvitationDetails(token);
    }
  }, [location.search]);

  const fetchInvitationDetails = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, organizations:organization_id(school_name)')
        .eq('token', token)
        .single();

      if (error) throw error;
      if (data) setInvitation(data);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      // Don't show error toast here as it's not critical for signup
    }
  };

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
        
        // If this was an invitation signup, navigate back to the invitation accept page
        if (invitationToken) {
          navigate(`/invitation/accept?token=${invitationToken}`);
        } else {
          // Regular signup flow - navigate to email confirmation page
          navigate('/email-confirmation', { 
            state: { email: data.email } 
          });
        }
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
          title={invitation ? `Join ${invitation.organizations.school_name}` : "Create your account"} 
          subtitle={invitation 
            ? `Complete your account to accept the invitation as ${invitation.role.replace('_', ' ')}`
            : "Sign up to start creating wellbeing surveys for your staff"
          }
        />
        {invitation && (
          <div className="mb-4 text-sm text-brandPurple-100 rounded-lg p-3 bg-brandPurple-50 border border-brandPurple-100">
            <p>You've been invited to join an organization. Create your account to continue.</p>
          </div>
        )}
        {!invitation && (
          <div className="mb-4 text-sm text-gray-600 rounded-lg p-2 bg-blue-50 border border-blue-100">
            <p>Please make sure you have internet connectivity to create an account.</p>
          </div>
        )}
        <AuthForm mode="signup" onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
};

export default SignUp;
