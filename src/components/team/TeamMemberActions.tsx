
import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.info('Member removal is disabled in the simplified authentication model', {
        description: 'This feature has been removed as part of the authentication simplification.',
        duration: 5000
      });
      
      // Refresh the UI to maintain proper flow
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
      toast.info('Invitation cancellation is disabled in the simplified authentication model', {
        description: 'This feature has been removed as part of the authentication simplification.',
        duration: 5000
      });
      
      // Refresh the UI to maintain proper flow
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
