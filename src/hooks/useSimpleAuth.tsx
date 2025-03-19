
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Simplified authentication hook that only checks if a user is authenticated
 * without any complex role management
 */
export function useSimpleAuth() {
  const { user, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Simply check if the user exists
    setIsAuthenticated(!!user);
  }, [user]);

  return {
    isAuthenticated,
    isLoading,
    error,
    // Simple helpers that only check authentication status
    canView: () => isAuthenticated,
    canEdit: () => isAuthenticated,
    canCreate: () => isAuthenticated,
    canDelete: () => isAuthenticated
  };
}
