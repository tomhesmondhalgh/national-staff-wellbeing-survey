import { useState, useEffect } from 'react';
import { useRoleManagement } from './useRoleManagement';
import { UserRoleType } from '../lib/supabase/client';
import { toast } from 'sonner';

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
    console.log('Using new role system by default');
    
    // This could be replaced with a proper analytics call if needed
    console.log('Role system telemetry: Using new system exclusively');
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
    error,
    
    // Keep these methods for API compatibility, but simplify their implementation
    enableNewRoleSystem: () => {
      toast.success('New role system is already enabled by default.');
    },
    
    disableNewRoleSystem: () => {
      toast.info('The application now exclusively uses the new role system.');
    },
    
    // Always true since we're only using the new system
    isUsingNewRoleSystem: true
  };
}
