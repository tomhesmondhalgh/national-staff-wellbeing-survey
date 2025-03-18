
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '../contexts/OrganizationContext';

export function useInvitation(token: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const { user, signIn } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('invitations')
          .select('*, organizations:organization_id(school_name)')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          throw new Error('Invitation not found or has expired');
        }

        if (data.accepted_at) {
          throw new Error('This invitation has already been accepted');
        }

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
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', user!.id)
        .single();

      if (existingMember) {
        toast.info('You are already a member of this organisation');
        navigate('/dashboard');
        return;
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user!.id,
          role: invitation.role
        });

      if (memberError) throw memberError;

      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      await refreshOrganizations();

      setAccountCreated(true);
      toast.success('You have successfully joined the organisation');
      
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

  return {
    isLoading,
    invitation,
    error,
    showAuthForm,
    accountCreated,
    handleAcceptInvitation,
    handleAuthFormSubmit,
    setShowAuthForm
  };
}
