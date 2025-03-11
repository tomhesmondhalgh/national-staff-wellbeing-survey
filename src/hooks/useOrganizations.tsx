
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserOrganizations, 
  getUserRoleForOrganization,
  Organization,
  UserRoleType
} from '../lib/supabase/client';

export interface OrganizationWithRole extends Organization {
  role: UserRoleType | null;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Function to fetch organizations and roles
  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const orgs = await getUserOrganizations();
      
      // Get roles for each organization
      const orgsWithRoles = await Promise.all(
        orgs.map(async (org) => {
          const role = await getUserRoleForOrganization(org.id);
          return { ...org, role };
        })
      );
      
      setOrganizations(orgsWithRoles);
      
      // Set current organization from localStorage or use the first one
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = savedOrgId 
        ? orgsWithRoles.find(org => org.id === savedOrgId) 
        : null;
        
      setCurrentOrganization(savedOrg || (orgsWithRoles.length > 0 ? orgsWithRoles[0] : null));
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a different organization
  const switchOrganization = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', organizationId);
    }
  };

  // Effect to fetch organizations when the user changes
  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  return {
    organizations,
    currentOrganization,
    isLoading,
    switchOrganization,
    refreshOrganizations: fetchOrganizations
  };
}
