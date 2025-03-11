
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
        
        const { data, error } = await supabase
          .rpc('get_organization_invitations', { org_id: organizationId });
          
        if (error) {
          console.error('Error fetching invitations with RPC:', error);
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('invitations')
            .select('*')
            .eq('organization_id', organizationId);
            
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            return [];
          }
          
          console.log('Fetched invitations with fallback query:', fallbackData?.length || 0);
          return fallbackData || [];
        }
        
        console.log('Fetched invitations with RPC:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error in invitation fetch:', error);
        
        try {
          const { data: manualData, error: manualError } = await supabase
            .from('invitations')
            .select('*')
            .eq('organization_id', organizationId);
            
          if (!manualError) {
            console.log('Manual invitations query succeeded:', manualData?.length || 0);
            return manualData || [];
          }
        } catch (e) {
          console.error('Manual query also failed:', e);
        }
        
        return [];
      }
    },
    enabled: !!organizationId,
    retry: 2,
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
