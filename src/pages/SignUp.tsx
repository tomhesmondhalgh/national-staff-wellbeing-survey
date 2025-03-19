import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthForm from '../components/auth/AuthForm';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase/client';
import { SignUpFormData } from '../types/auth';

const SIGNUP_VERSION = 'main_signup_component_v1';

const SignUp = () => {
  console.log(`Rendering SignUp component (${SIGNUP_VERSION})`);
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, completeUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    console.log('SignUp component mounted with:');
    console.log('- Current URL:', window.location.href);
    console.log('- Environment:', import.meta.env.MODE);
    console.log('- Route location:', location);
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('invitation');
    
    if (token) {
      setInvitationToken(token);
      fetchInvitationDetails(token);
    }
    
    console.log('SignUp component mounted, pathname:', location.pathname);
  }, [location.search, location.pathname]);

  const fetchInvitationDetails = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*, organizations:organization_id(school_name)')
        .eq('token', token)
        .single();

      if (error) throw error;
      if (data) {
        console.log('Invitation details fetched:', data);
        setInvitation(data);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
    }
  };

  const handleSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    console.log('Form submitted with data:', data);
    
    try {
      const { error: signUpError, success: signUpSuccess, user } = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      if (!signUpSuccess || !user) {
        throw signUpError || new Error('Failed to create account');
      }
      
      const userData = {
        jobTitle: data.jobTitle,
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress || compileCustomAddress(data),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      const { error: profileError, success: profileSuccess } = await completeUserProfile(userData);
      
      if (!profileSuccess) {
        throw profileError || new Error('Failed to complete profile');
      }
      
      if (invitationToken) {
        console.log(`Signup successful, redirecting to invitation accept with token: ${invitationToken}`);
        navigate(`/invitation/accept?token=${invitationToken}`);
      } else {
        console.log('Signup successful, redirecting to dashboard');
        toast.success('Account created successfully!', {
          description: 'Welcome to the platform. You can now log in.'
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Signup error details:', err);
      toast.error('Failed to create account', {
        description: err.message || 'Please check your information and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const compileCustomAddress = (data: SignUpFormData) => {
    const addressParts = [
      data.customStreetAddress,
      data.customStreetAddress2,
      data.customCity,
      data.customCounty,
      data.customPostalCode,
      data.customCountry,
    ].filter(Boolean);
    
    return addressParts.join(', ');
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title={invitation ? `Join ${invitation.organizations.school_name}` : "Create your account"} 
          subtitle={invitation 
            ? `Complete your account to accept the invitation as ${invitation.role.replace('_', ' ')}`
            : "Sign up to create wellbeing surveys for your staff"
          }
        />
        {invitation && (
          <div className="mb-4 text-sm text-brandPurple-100 rounded-lg p-3 bg-brandPurple-50 border border-brandPurple-100">
            <p>You've been invited to join an organization. Create your account to continue.</p>
          </div>
        )}
        <AuthForm 
          mode="signup" 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          invitationData={invitation}
        />
      </div>
    </MainLayout>
  );
};

export default SignUp;
