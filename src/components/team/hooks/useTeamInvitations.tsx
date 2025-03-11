
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export function useTeamInvitations(organizationId: string | undefined) {
  const { 
    data: invitations, 
    isLoading: invitationsLoading, 
    error: invitationsError,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['organizationInvitations', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      try {
        const { data, error } = await supabase.rpc('get_organization_invitations', { 
          org_id: organizationId 
        });
          
        if (error) {
          console.error('Error fetching invitations:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in invitation fetch:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    refetchInterval: 5000
  });

  return {
    invitations,
    invitationsLoading,
    invitationsError,
    refetchInvitations
  };
}
