
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, getUserRoleForOrganization, userHasPermission } from '../lib/supabase/client';

export function usePermissions() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !currentOrganization) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const role = await getUserRoleForOrganization(currentOrganization.id);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, currentOrganization]);

  // Function to check if user has at least the specified role
  const hasPermission = async (requiredRole: UserRoleType): Promise<boolean> => {
    if (!user || !currentOrganization) return false;
    
    try {
      return await userHasPermission(currentOrganization.id, requiredRole);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // Common permission checks
  const canCreate = async (): Promise<boolean> => hasPermission('editor');
  const canEdit = async (): Promise<boolean> => hasPermission('editor');
  const canManageTeam = async (): Promise<boolean> => hasPermission('organization_admin');
  const canManageGroups = async (): Promise<boolean> => hasPermission('group_admin');
  const isAdmin = async (): Promise<boolean> => hasPermission('administrator');

  return {
    userRole,
    isLoading,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam,
    canManageGroups,
    isAdmin
  };
}
