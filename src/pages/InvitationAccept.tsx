
import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const InvitationAccept = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch invitation details
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError('Invitation not found or has expired');
          setIsLoading(false);
          return;
        }
        
        setInvitation(data);
      } catch (error) {
        console.error('Error verifying invitation:', error);
        setError('Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;
    
    setIsAccepting(true);
    
    try {
      // Add user to organization with appropriate role
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
        });
        
      if (memberError) {
        throw memberError;
      }
      
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);
        
      if (updateError) {
        throw updateError;
      }
      
      toast.success('Invitation accepted successfully');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`} replace />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto p-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Invitation Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-brandPurple-500 hover:bg-brandPurple-600"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : invitation ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Accept Invitation</h2>
              <p className="mb-6">
                You've been invited to join <span className="font-semibold">{invitation.organization_name || "an organization"}</span> as a <span className="font-semibold">{invitation.role}</span>.
              </p>
              <Button 
                onClick={handleAcceptInvitation} 
                disabled={isAccepting}
                className="bg-brandPurple-500 hover:bg-brandPurple-600 w-full"
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </MainLayout>
  );
};

export default InvitationAccept;
