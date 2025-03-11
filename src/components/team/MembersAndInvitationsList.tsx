
import React, { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import InviteMemberDialog from './InviteMemberDialog';
import { usePermissions } from '../../hooks/usePermissions';
import { useTestingMode } from '../../contexts/TestingModeContext';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useTeamInvitations } from './hooks/useTeamInvitations';
import { useProfiles } from './hooks/useProfiles';
import { useCombinedTeamMembers } from './hooks/useCombinedTeamMembers';
import TeamMembersHeader from './TeamMembersHeader';
import TeamMemberFilters from './TeamMemberFilters';
import TeamMembersTable from './TeamMembersTable';
import TeamMembersError from './TeamMembersError';

const ITEMS_PER_PAGE = 10;

const MembersAndInvitationsList = () => {
  const { currentOrganization } = useOrganization();
  const { userRole } = usePermissions();
  const { isTestingMode, testingRole } = useTestingMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Fetch organization members
  const {
    members,
    membersLoading,
    membersError,
    refetchMembers,
    isPersonalOrg
  } = useTeamMembers(currentOrganization?.id);
  
  // Fetch invitations
  const {
    invitations,
    invitationsLoading,
    invitationsError,
    refetchInvitations
  } = useTeamInvitations(currentOrganization?.id);
  
  // Fetch user profiles
  const {
    profiles,
    profilesLoading,
    profilesError
  } = useProfiles(members);

  // Combine members and invitations
  const {
    filteredItems
  } = useCombinedTeamMembers(
    members,
    invitations,
    profiles,
    { searchTerm, roleFilter }
  );

  const isLoading = membersLoading || invitationsLoading || profilesLoading;
  const error = membersError || invitationsError || profilesError;

  const refetchAll = () => {
    refetchMembers();
    refetchInvitations();
  };

  const handleInvitationComplete = () => {
    console.log('Invitation complete, refreshing data...');
    refetchAll();
    setIsInviteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <TeamMembersError 
        error={error instanceof Error ? error : new Error('Unknown error')}
        userRole={userRole}
        organizationName={currentOrganization?.name}
        refetchAll={refetchAll}
      />
    );
  }

  return (
    <div>
      <TeamMembersHeader onInvite={() => setIsInviteDialogOpen(true)} />
      
      <TeamMemberFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        setCurrentPage={() => {}}
      />

      <TeamMembersTable 
        filteredItems={filteredItems}
        refetchAll={refetchAll}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <InviteMemberDialog 
        isOpen={isInviteDialogOpen} 
        onClose={() => setIsInviteDialogOpen(false)} 
        onComplete={handleInvitationComplete}
        organizationId={currentOrganization?.id || ''}
      />
    </div>
  );
};

export default MembersAndInvitationsList;
