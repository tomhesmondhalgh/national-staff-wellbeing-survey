
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
        // Use direct query instead of RPC function to avoid recursion
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', organizationId)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString());
          
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
