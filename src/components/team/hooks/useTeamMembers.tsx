
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { OrganizationMember } from '../../../lib/supabase/client';
import { TeamMember } from '../types';
import { useAuth } from '../../../contexts/AuthContext';
import { convertOrganizationMembers } from '../../../utils/typeConversions';

export function useTeamMembers(organizationId: string | undefined) {
  const { user } = useAuth();
  const [useDirectQuery, setUseDirectQuery] = useState(false);
  
  const isPersonalOrg = organizationId === user?.id;
  
  const { 
    data: members, 
    isLoading: membersLoading, 
    error: membersError,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['organizationMembers', organizationId, useDirectQuery],
    queryFn: async () => {
      if (!organizationId) return [];
      
      try {
        if (isPersonalOrg || useDirectQuery) {
          console.log('Using direct SQL query for members due to recursion prevention');
          
          if (isPersonalOrg && user) {
            return convertOrganizationMembers([{
              id: `personal-org-${user.id}`,
              user_id: user.id,
              organization_id: organizationId,
              role: 'organization_admin',
              is_primary: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
          }
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name, school_name')
            .eq('school_name', organizationId);
            
          if (profilesError) throw profilesError;
          
          return convertOrganizationMembers(profiles.map((profile: any) => ({
            id: `derived-${profile.id}`,
            user_id: profile.id,
            organization_id: organizationId,
            role: 'organization_admin',
            is_primary: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));
        }
        
        // Use direct query instead of RPC function to avoid issues
        const { data, error } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', organizationId);
          
        if (error) {
          console.error('Error fetching organization members:', error);
          throw error;
        }
        
        return convertOrganizationMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    retry: 1
  });

  return {
    members,
    membersLoading,
    membersError,
    refetchMembers,
    isPersonalOrg
  };
}
