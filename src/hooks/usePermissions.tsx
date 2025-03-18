
import { useState, useEffect } from 'react';
import { useRoleFetcher } from './useRoleFetcher';
import { useRoleChecks } from './useRoleChecks';
import { usePermissionActions } from './usePermissionActions';
import { useRoleManagement } from './useRoleManagement';
import { UserRoleType } from '../lib/supabase/client';

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
    // You could read this from environment variables, localStorage, or a feature flag service
    // For now, we'll default to false to maintain backward compatibility
    const shouldUseNewSystem = localStorage.getItem('useNewRoleSystem') === 'true';
    setUseNewRoleSystem(shouldUseNewSystem);
    
    // Log which system is being used
    console.log(`Using ${shouldUseNewSystem ? 'new' : 'classic'} role system`);
  }, []);

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
    
    // Add a method to explicitly enable the new role system
    enableNewRoleSystem: () => {
      localStorage.setItem('useNewRoleSystem', 'true');
      setUseNewRoleSystem(true);
    }
  };
}
