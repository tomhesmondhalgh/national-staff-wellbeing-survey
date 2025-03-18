
import { useCallback } from 'react';
import { UserRoleType } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';

export function useRoleChecks(userRole: UserRoleType | null) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();

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
      
      return roleHierarchy[testingRole as UserRoleType] >= roleHierarchy[requiredRole];
    }
    
    if (!currentOrganization) return false;
    
    // Always give permission to organization admins for their own organization
    if (userRole === 'organization_admin' && 
        (requiredRole === 'organization_admin' || requiredRole === 'editor' || requiredRole === 'viewer')) {
      return true;
    }
    
    // Always give permission to group admins
    if (userRole === 'group_admin') {
      return true;
    }
    
    // Always give permission to system administrators
    if (userRole === 'administrator') {
      return true;
    }
    
    // Check editor permissions
    if (userRole === 'editor' && (requiredRole === 'editor' || requiredRole === 'viewer')) {
      return true;
    }
    
    // Check viewer permissions
    if (userRole === 'viewer' && requiredRole === 'viewer') {
      return true;
    }
    
    return false;
  }, [user, currentOrganization, isTestingMode, testingRole, userRole]);

  return { hasPermission };
}
