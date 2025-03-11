
import { useState } from 'react';
import { OrganizationMember } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import EditRoleDialog from './EditRoleDialog';

type TeamMemberActionsProps = {
  memberId: string;
  type: 'member' | 'invitation';
  refetchAll: () => void;
  member?: OrganizationMember;
};

export default function TeamMemberActions({ memberId, type, refetchAll, member }: TeamMemberActionsProps) {
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      if (memberId.startsWith('derived-') || memberId.startsWith('personal-org-')) {
        toast.error('Cannot remove organization owner');
        return;
      }
      
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      toast.success('Member removed successfully');
      refetchAll();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    setIsLoading(true);
    try {
      console.log('Cancelling invitation:', invitationId);
      
      // Get the session token for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error('No valid session found - cannot proceed with cancellation');
        throw new Error('No valid session found');
      }
      
      console.log('Session found, access token available');
      
      // Construct the full URL for the edge function
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-invitation`;
      console.log('Calling edge function at:', edgeFunctionUrl);
      
      // Call the edge function with proper authentication
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ invitationId })
      });
      
      console.log('Edge function response status:', response.status);
      
      // Parse response and check for success
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response from edge function:', errorData);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Edge function response data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      toast.success('Invitation cancelled successfully');
      refetchAll();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (member: OrganizationMember) => {
    if (member.id.startsWith('derived-') || member.id.startsWith('personal-org-')) {
      toast.error('Cannot change organization owner role');
      return;
    }
    
    setSelectedMember(member);
    setIsEditRoleDialogOpen(true);
  };

  const handleRoleUpdated = () => {
    refetchAll();
    setIsEditRoleDialogOpen(false);
    setSelectedMember(null);
  };
  
  return (
    <>
      {type === 'member' && member ? (
        <>
          <button onClick={() => handleEditRole(member)}>
            Change Role
          </button>
          <button 
            onClick={() => handleRemoveMember(memberId)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            Remove
          </button>
        </>
      ) : (
        <button 
          onClick={() => handleCancelInvitation(memberId)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Invitation'}
        </button>
      )}
      
      {selectedMember && (
        <EditRoleDialog
          isOpen={isEditRoleDialogOpen}
          onClose={() => setIsEditRoleDialogOpen(false)}
          member={selectedMember}
          onRoleUpdated={handleRoleUpdated}
        />
      )}
    </>
  );
}
