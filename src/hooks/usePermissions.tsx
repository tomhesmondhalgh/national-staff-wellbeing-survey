
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, getUserRoleForOrganization, userHasPermission, supabase } from '../lib/supabase/client';

export function usePermissions() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // If in testing mode with a role, use that role
      if (isTestingMode && testingRole) {
        console.log('Using testing role:', testingRole);
        setUserRole(testingRole);
        setIsLoading(false);
        return;
      }

      // If no organization is selected, we can't determine a role
      if (!currentOrganization) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const role = await getUserRoleForOrganization(currentOrganization.id);
        console.log(`Fetched user role for organization ${currentOrganization.id}:`, role);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, currentOrganization, isTestingMode, testingRole]);

  // Function to check if user has at least the specified role
  const hasPermission = useCallback(async (requiredRole: UserRoleType): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode with a role, use that role for permission checks
    if (isTestingMode && testingRole) {
      console.log(`Testing mode permission check: ${testingRole} >= ${requiredRole}?`);
      const roleHierarchy: Record<UserRoleType, number> = {
        'administrator': 4,
        'group_admin': 3,
        'organization_admin': 2,
        'editor': 1,
        'viewer': 0
      };
      
      return roleHierarchy[testingRole] >= roleHierarchy[requiredRole];
    }
    
    if (!currentOrganization) return false;
    
    try {
      const hasAccess = await userHasPermission(currentOrganization.id, requiredRole);
      console.log(`Permission check for ${requiredRole} in org ${currentOrganization.id}: ${hasAccess}`);
      return hasAccess;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, [user, currentOrganization, isTestingMode, testingRole]);

  // Common permission checks
  const canCreate = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canEdit = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canManageTeam = useCallback(async (): Promise<boolean> => {
    // Organization admins should be able to manage team members
    if (userRole === 'organization_admin') {
      return true;
    }
    
    // If in testing mode with appropriate admin role, allow team management
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin' || 
         testingRole === 'organization_admin')) {
      return true;
    }
    
    return hasPermission('organization_admin');
  }, [userRole, isTestingMode, testingRole, hasPermission]);
  
  // Check if user is a group admin
  const canManageGroups = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode with group_admin role, return true
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin')) {
      return true;
    }
    
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
  }, [user, isTestingMode, testingRole]);
  
  const isAdmin = useCallback(async (): Promise<boolean> => {
    // If testing mode is on and user has administrator role in testing
    if (isTestingMode && testingRole === 'administrator') {
      return true;
    }
    
    // Otherwise check for real admin privileges
    try {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'administrator')
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }, [user, isTestingMode, testingRole]);

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
