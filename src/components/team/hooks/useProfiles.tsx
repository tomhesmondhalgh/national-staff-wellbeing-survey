
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { OrganizationMember } from '../../../lib/supabase/client';

export function useProfiles(members: OrganizationMember[] | undefined) {
  const { 
    data: profiles, 
    isLoading: profilesLoading, 
    error: profilesError 
  } = useQuery({
    queryKey: ['userProfiles', members],
    queryFn: async () => {
      if (!members || members.length === 0) return [];
      
      const userIds = members.map(member => member.user_id);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
    },
    enabled: !!members && members.length > 0
  });

  return {
    profiles,
    profilesLoading,
    profilesError
  };
}
