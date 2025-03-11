
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
        console.log('Fetching invitations for organization:', organizationId);
        
        // Use a custom function to avoid recursion issues
        const { data, error } = await supabase.rpc('get_organization_invitations', { 
          org_id: organizationId 
        });
          
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
    refetchInterval: 5000
  });

  useEffect(() => {
    if (invitations) {
      console.log('Current invitations data:', invitations);
    }
  }, [invitations]);

  return {
    invitations,
    invitationsLoading,
    invitationsError,
    refetchInvitations
  };
}
