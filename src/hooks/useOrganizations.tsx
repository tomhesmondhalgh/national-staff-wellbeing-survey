
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Organization, UserRoleType } from '../lib/supabase/client';

export interface OrganizationWithRole extends Organization {
  role: UserRoleType;
  id: string; // Adding id to the interface to fix the error
}

export const useOrganizations = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setOrganizations([]);
      setIsLoading(false);
      return;
    }

    const fetchOrganizations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Direct query instead of function call
        const { data: orgMembers, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id);
          
        if (orgError) {
          throw orgError;
        }
        
        const orgsWithRoles: OrganizationWithRole[] = [];

        for (const org of orgMembers || []) {
          // Fetch organization name
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('school_name')
              .eq('id', org.organization_id);

            if (profileError) {
              console.error('Error fetching org profile:', profileError);
              continue;
            }

            const orgName = profile && profile[0]?.school_name ? profile[0].school_name : 'Unknown Organization';
            
            orgsWithRoles.push({
              id: org.organization_id,
              name: orgName,
              created_at: new Date().toISOString(),
              role: org.role
            });
          } catch (err) {
            console.error('Error fetching org details:', err);
          }
        }

        setOrganizations(orgsWithRoles);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading organizations'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  return { organizations, isLoading, error };
};
