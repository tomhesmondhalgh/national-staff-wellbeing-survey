
import { useState, useEffect } from 'react';
import { useAdminRoleOptimized } from './useAdminRoleOptimized';
import { useRoleManagement } from './useRoleManagement';

export function useAdminRole() {
  // The optimized version with caching
  const optimizedHook = useAdminRoleOptimized();
  
  // The new implementation using our improved role system
  const { isAdmin: newIsAdmin, isLoading: newIsLoading } = useRoleManagement();
  
  // State to track which system to use
  const [useNewRoleSystem, setUseNewRoleSystem] = useState(false);
  // State to track admin status from new system
  const [isAdminFromNew, setIsAdminFromNew] = useState(false);
  
  useEffect(() => {
    // Check if we should use the new role system
    const shouldUseNewSystem = localStorage.getItem('useNewRoleSystem') === 'true';
    setUseNewRoleSystem(shouldUseNewSystem);
    
    // If using new system, check admin status
    if (shouldUseNewSystem) {
      const checkAdminStatus = async () => {
        const isUserAdmin = await newIsAdmin();
        setIsAdminFromNew(isUserAdmin);
      };
      
      checkAdminStatus();
    }
  }, [newIsAdmin]);
  
  // Return appropriate implementation based on feature flag
  return useNewRoleSystem ? 
    { 
      isAdmin: isAdminFromNew, 
      isLoading: newIsLoading,
      refreshAdminStatus: async () => {
        const isUserAdmin = await newIsAdmin();
        setIsAdminFromNew(isUserAdmin);
      }
    } : 
    optimizedHook;
}
