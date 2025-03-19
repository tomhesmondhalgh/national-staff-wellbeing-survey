
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type TeamMemberActionsProps = {
  memberId: string;
  type: 'member' | 'invitation';
  refetchAll: () => void;
  member?: any; // Make member optional to fix TypeScript error
};

export default function TeamMemberActions({ memberId, type, refetchAll, member }: TeamMemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      toast.error('This functionality has been simplified and removing members is currently disabled');
      // We've removed organization_members table in the simplification
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
      toast.error('This functionality has been simplified and cancelling invitations is currently disabled');
      // We've removed invitations table in the simplification
      refetchAll();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {type === 'member' ? (
        <button 
          onClick={() => handleRemoveMember(memberId)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
        >
          Remove
        </button>
      ) : (
        <button 
          onClick={() => handleCancelInvitation(memberId)}
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Invitation'}
        </button>
      )}
    </>
  );
}
