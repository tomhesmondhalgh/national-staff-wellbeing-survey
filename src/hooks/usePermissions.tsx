
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleAuth } from './useSimpleAuth';

/**
 * A simplified permissions hook that replaces the complex role-based system
 * with direct authentication checks
 */
export function usePermissions() {
  const { user } = useAuth();
  const { isAuthenticated } = useSimpleAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // In the simplified model, we just check if the user is authenticated
  const hasPermission = async (requiredPermission: string): Promise<boolean> => {
    // All authenticated users have all permissions in the simplified model
    return isAuthenticated;
  };

  // Add helper methods that were used in various components
  const canView = () => isAuthenticated;
  const canEdit = () => isAuthenticated;
  const canCreate = () => isAuthenticated;
  const canDelete = () => isAuthenticated;

  return {
    userRole: isAuthenticated ? 'authenticated_user' : 'unauthenticated',
    isAdmin: isAuthenticated,
    hasPermission,
    permissions,
    isLoading: false,
    error: null,
    // Add the helper methods for compatibility
    canView,
    canEdit,
    canCreate,
    canDelete
  };
}
