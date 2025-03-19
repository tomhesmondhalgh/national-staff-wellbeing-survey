
import { useQuery } from '@tanstack/react-query';

// Simplified hook that returns empty invitations since we've removed the invitation system
export function useTeamInvitations(organizationId: string | undefined) {
  const { 
    data: invitations, 
    isLoading: invitationsLoading, 
    error: invitationsError,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['organizationInvitations', organizationId],
    queryFn: async () => {
      // In the simplified model, we return an empty array
      return [];
    },
    enabled: !!organizationId
  });

  return {
    invitations: [],
    invitationsLoading: false,
    invitationsError: null,
    refetchInvitations
  };
}
