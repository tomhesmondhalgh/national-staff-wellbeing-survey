
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, getUserRoleForOrganization, userHasPermission, supabase } from '../lib/supabase/client';

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
  
  // Check if user is a group admin
  const canManageGroups = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check if user has the group_admin role in any group
      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'group_admin')
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      return data.length > 0;
    } catch (error) {
      console.error('Error checking group admin permission:', error);
      return false;
    }
  };
  
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
