
import { useEffect, useState, useCallback } from 'react';
import { useRoleManagement } from './useRoleManagement';
import { UserRoleType } from '@/lib/supabase/client';

export function usePermissions() {
  // We'll use the role management hook as the source of truth
  const { 
    currentRole,
    isLoading,
    error
  } = useRoleManagement();
  
  // For analytics/monitoring purposes
  useEffect(() => {
    console.log('Using simplified role system: current role =', currentRole);
  }, [currentRole]);

  // Simplified permission checking functions
  const isAdmin = useCallback(() => {
    return currentRole === 'administrator' || currentRole === 'organization_admin';
  }, [currentRole]);

  const isEditor = useCallback(() => {
    return currentRole === 'editor' || isAdmin();
  }, [currentRole, isAdmin]);

  const isViewer = useCallback(() => {
    return currentRole === 'viewer' || isEditor();
  }, [currentRole, isEditor]);

  // Legacy compatibility
  const hasPermission = useCallback((requiredRole: UserRoleType): boolean => {
    switch (requiredRole) {
      case 'administrator':
        return currentRole === 'administrator';
      case 'organization_admin':
        return isAdmin();
      case 'editor':
        return isEditor();
      case 'viewer':
        return isViewer();
      default:
        return false;
    }
  }, [currentRole, isAdmin, isEditor, isViewer]);

  return {
    userRole: currentRole,
    isLoading,
    // Simplified role check functions
    isAdmin,
    isEditor,
    isViewer,
    // Legacy compatibility
    hasPermission,
    canCreate: isEditor,
    canEdit: isEditor,
    canManageTeam: isAdmin,
    error
  };
}
