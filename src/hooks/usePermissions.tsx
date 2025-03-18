
import { useState, useEffect } from 'react';
import { useRoleFetcher } from './useRoleFetcher';
import { useRoleChecks } from './useRoleChecks';
import { usePermissionActions } from './usePermissionActions';
import { useRoleManagement } from './useRoleManagement';
import { UserRoleType } from '../lib/supabase/client';
import { toast } from 'sonner';

export function usePermissions() {
  // The classic implementation (for backward compatibility)
  const { userRole, isLoading: oldIsLoading, queryError } = useRoleFetcher();
  const { hasPermission: oldHasPermission } = useRoleChecks(userRole);
  const { canCreate: oldCanCreate, canEdit: oldCanEdit, canManageTeam: oldCanManageTeam, 
          canManageGroups: oldCanManageGroups, isAdmin: oldIsAdmin } = usePermissionActions(userRole);
  
  // The new implementation using our improved role system
  const { 
    currentRole,
    isLoading: newIsLoading,
    error: newError,
    hasPermission: newHasPermission,
    canCreate: newCanCreate,
    canEdit: newCanEdit,
    canManageTeam: newCanManageTeam,
    canManageGroups: newCanManageGroups,
    isAdmin: newIsAdmin
  } = useRoleManagement();
  
  // We'll use a feature flag to decide which implementation to use
  const [useNewRoleSystem, setUseNewRoleSystem] = useState(false);
  
  useEffect(() => {
    // Check if new role system is enabled
    const shouldUseNewSystem = localStorage.getItem('useNewRoleSystem') === 'true';
    setUseNewRoleSystem(shouldUseNewSystem);
    
    // Log which system is being used for monitoring
    console.log(`Using ${shouldUseNewSystem ? 'new' : 'classic'} role system`);
    
    // Add telemetry to track adoption if needed
    if (shouldUseNewSystem) {
      // This could be replaced with a proper analytics call
      console.log('Role system telemetry: Using new system');
    }
  }, []);

  // Validate that roles are consistent between old and new systems
  useEffect(() => {
    // Only run in development to help catch discrepancies during transition
    if (process.env.NODE_ENV === 'development' && !oldIsLoading && !newIsLoading) {
      if (userRole !== currentRole) {
        console.warn('Role inconsistency detected:', {
          oldSystem: userRole,
          newSystem: currentRole
        });
      }
    }
  }, [userRole, currentRole, oldIsLoading, newIsLoading]);

  return {
    // Return the appropriate implementation based on the feature flag
    userRole: useNewRoleSystem ? currentRole : userRole,
    isLoading: useNewRoleSystem ? newIsLoading : oldIsLoading,
    hasPermission: useNewRoleSystem ? newHasPermission : oldHasPermission, 
    canCreate: useNewRoleSystem ? newCanCreate : oldCanCreate,
    canEdit: useNewRoleSystem ? newCanEdit : oldCanEdit,
    canManageTeam: useNewRoleSystem ? newCanManageTeam : oldCanManageTeam,
    canManageGroups: useNewRoleSystem ? newCanManageGroups : oldCanManageGroups,
    isAdmin: useNewRoleSystem ? newIsAdmin : oldIsAdmin,
    error: useNewRoleSystem ? newError : queryError,
    
    // Methods to control the role system
    enableNewRoleSystem: () => {
      localStorage.setItem('useNewRoleSystem', 'true');
      setUseNewRoleSystem(true);
      toast.success('New role system enabled. Page will refresh for changes to take effect.', {
        duration: 5000,
        onAutoClose: () => window.location.reload()
      });
    },
    
    disableNewRoleSystem: () => {
      localStorage.setItem('useNewRoleSystem', 'false');
      setUseNewRoleSystem(false);
      toast.info('Reverted to classic role system. Page will refresh for changes to take effect.', {
        duration: 5000,
        onAutoClose: () => window.location.reload()
      });
    },
    
    // Expose the current system being used
    isUsingNewRoleSystem: useNewRoleSystem
  };
}
