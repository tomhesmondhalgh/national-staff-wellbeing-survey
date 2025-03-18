
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getUserOrganizations,
  getUserRoleForOrganization,
  Organization,
  UserRoleType
} from '../lib/supabase/client';

export interface OrganizationWithRole extends Organization {
  role: UserRoleType;
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
        const userOrgs = await getUserOrganizations(user.id);
        const orgsWithRoles: OrganizationWithRole[] = [];

        for (const org of userOrgs) {
          // Fetch organization name
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('school_name')
              .eq('id', org.id)
              .single();

            if (profile && profile.school_name) {
              org.name = profile.school_name;
            }

            const role = await getUserRoleForOrganization(user.id, org.id);
            orgsWithRoles.push({
              ...org,
              role: role || 'viewer'
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
