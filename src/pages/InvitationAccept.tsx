
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useOrganization } from '../contexts/OrganizationContext';

const InvitationAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { refreshOrganizations } = useOrganization();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
        if (data.status === 'accepted') {
          throw new Error('This invitation has already been accepted');
        }

        // Check if invitation is expired (older than 7 days)
        const createdAt = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
          // Update invitation status to expired
          await supabase
            .from('invitations')
            .update({ status: 'expired' })
            .eq('id', data.id);
            
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
        // If user is not logged in, redirect to signup with the token in the URL
        // After signup/login, they'll be redirected back here
        navigate(`/signup?redirect=/invitation/accept?token=${token}`);
        return;
      }

      // Check if user is already a member of the organization
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', user.id)
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
          user_id: user.id,
          role: invitation.role
        });

      if (memberError) {
        throw memberError;
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh organizations in context
      await refreshOrganizations();

      toast.success('You have successfully joined the organization');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
    } finally {
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
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
  );
};

export default InvitationAccept;
