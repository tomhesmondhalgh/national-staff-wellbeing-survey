
import { useEffect } from 'react';
import { useRoleManagement } from './useRoleManagement';
import { UserRoleType } from '../lib/supabase/client';

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
    canManageGroups,
    isAdmin
  } = useRoleManagement();
  
  // For analytics/monitoring purposes
  useEffect(() => {
    console.log('Using new role system exclusively');
  }, []);

  return {
    // Return the new implementation directly
    userRole: currentRole,
    isLoading,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam, 
    canManageGroups,
    isAdmin,
    error
  };
}
