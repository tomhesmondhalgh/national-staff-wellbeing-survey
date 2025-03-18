
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useRoleChecks } from './useRoleChecks';

export function usePermissionActions(userRole: string | null) {
  const { user } = useAuth();
  const { isTestingMode, testingRole } = useTestingMode();
  const { hasPermission } = useRoleChecks(userRole as any);

  // Common permission checks
  const canCreate = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canEdit = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canManageTeam = useCallback(async (): Promise<boolean> => {
    // Organization admins should be able to manage team members
    if (userRole === 'organization_admin' || userRole === 'group_admin' || userRole === 'administrator') {
      return true;
    }
    
    // If in testing mode with appropriate admin role, allow team management
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin' || 
         testingRole === 'organization_admin')) {
      return true;
    }
    
    return false;
  }, [userRole, isTestingMode, testingRole]);
  
  // Check if user is a group admin
  const canManageGroups = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode with group_admin role, return true
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin')) {
      return true;
    }
    
    // System administrators can manage groups
    if (userRole === 'administrator') {
      return true;
    }
    
    // Group admins can manage groups
    if (userRole === 'group_admin') {
      return true;
    }
    
    return false;
  }, [user, isTestingMode, testingRole, userRole]);
  
  const isAdmin = useCallback(async (): Promise<boolean> => {
    // If testing mode is on and user has administrator role in testing
    if (isTestingMode && testingRole === 'administrator') {
      return true;
    }
    
    // Check for administrator role
    if (userRole === 'administrator') {
      return true;
    }
    
    return false;
  }, [userRole, isTestingMode, testingRole]);

  return {
    canCreate,
    canEdit,
    canManageTeam,
    canManageGroups,
    isAdmin
  };
}
