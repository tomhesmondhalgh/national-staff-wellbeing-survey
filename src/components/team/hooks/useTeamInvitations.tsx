
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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
        console.log('Fetching invitations directly from the invitations table');
        
        // Directly query the invitations table
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('status', 'pending');
          
        if (error) {
          console.error('Error fetching invitations:', error);
          return [];
        }
        
        console.log('Successfully fetched invitations:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error in invitation fetch:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    // Refresh every 5 seconds
    refetchInterval: 5000
  });

  useEffect(() => {
    if (invitations) {
      console.log('Current invitations data:', invitations.length);
    }
  }, [invitations]);

  return {
    invitations,
    invitationsLoading,
    invitationsError,
    refetchInvitations
  };
}
