
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useOrganization } from '../contexts/OrganizationContext';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import AuthForm from '../components/auth/AuthForm';
import { Briefcase, CheckCircle } from 'lucide-react';

const InvitationAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { refreshOrganizations } = useOrganization();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch invitation by token
        const { data, error: fetchError } = await supabase
          .from('invitations')
          .select('*, organizations:organization_id(school_name)')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          throw new Error('Invitation not found or has expired');
        }

        // Check if invitation is already accepted
        if (data.accepted_at) {
          throw new Error('This invitation has already been accepted');
        }

        // Check if invitation is expired
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        
        if (expiresAt < now) {
          throw new Error('This invitation has expired');
        }

        setInvitation(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setIsLoading(true);
    try {
      if (!user) {
        // If user is not logged in, show auth form
        setShowAuthForm(true);
        setIsLoading(false);
        return;
      }

      await completeInvitationAcceptance();
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
      setIsLoading(false);
    }
  };

  const completeInvitationAcceptance = async () => {
    try {
      // Check if user is already a member of the organization
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', user!.id)
        .single();

      if (existingMember) {
        toast.info('You are already a member of this organization');
        navigate('/dashboard');
        return;
      }

      // Add user to the organization with the specified role
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user!.id,
          role: invitation.role
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Refresh organizations in context
      await refreshOrganizations();

      setAccountCreated(true);
      toast.success('You have successfully joined the organization');
      
      // Wait a moment before redirecting to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      throw error;
    }
  };

  const handleAuthFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (data.mode === 'login') {
        // Handle login
        const { error, success } = await signIn(data.email, data.password);
        
        if (success) {
          await completeInvitationAcceptance();
        } else if (error) {
          toast.error('Failed to log in', {
            description: error.message || 'Please check your credentials and try again.'
          });
          setIsLoading(false);
        }
      } else {
        // Handle signup
        // Note: You're using a more complex signup flow for this app through SignUp.tsx
        // Redirect to signup page with the token for the organization to join
        navigate(`/signup?invitation=${token}`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Authentication failed', {
        description: 'Please try again later.'
      });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Homepage
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (accountCreated) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-brandPurple-600 mb-4">Success!</h1>
            <p className="text-gray-700 mb-6">
              You have successfully joined <span className="font-semibold">{invitation?.organizations?.school_name}</span>.
              Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (showAuthForm) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Complete Your Invitation" 
            subtitle={`Sign in or create an account to join ${invitation?.organizations?.school_name}`}
          />
          <AuthForm onSubmit={handleAuthFormSubmit} isLoading={isLoading} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brandPurple-100 p-4 rounded-full">
              <Briefcase className="h-16 w-16 text-brandPurple-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-brandPurple-600 mb-4">Organization Invitation</h1>
          <p className="text-gray-700 mb-6">
            You've been invited to join <span className="font-semibold">{invitation?.organizations?.school_name}</span> as a <span className="font-semibold">{invitation?.role.replace('_', ' ')}</span>.
          </p>
          
          <Button 
            onClick={handleAcceptInvitation}
            disabled={isLoading}
            className="w-full bg-brandPurple-500 hover:bg-brandPurple-600 mb-4"
          >
            {isLoading ? "Processing..." : "Accept Invitation"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Decline
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default InvitationAccept;
