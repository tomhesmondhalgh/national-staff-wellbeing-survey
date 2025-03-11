
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
    
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      toast.success('Invitation cancelled successfully');
      refetchAll();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
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
        >
          Cancel Invitation
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
