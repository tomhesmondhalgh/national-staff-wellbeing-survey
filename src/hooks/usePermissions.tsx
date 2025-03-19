
import { useEffect } from 'react';
import { useRoleManagement } from './useRoleManagement';

export function usePermissions() {
  // We'll just use the new implementation directly
  const { 
    currentRole,
    isLoading,
    error,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam,
    isAdmin
  } = useRoleManagement();
  
  // For analytics/monitoring purposes
  useEffect(() => {
    console.log('Using role system: current role =', currentRole);
  }, [currentRole]);

  return {
    // Return the implementation directly
    userRole: currentRole,
    isLoading,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam,
    isAdmin,
    error
  };
}
