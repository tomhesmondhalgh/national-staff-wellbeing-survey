
import { useState, useEffect } from 'react';
import { useAdminRoleOptimized } from './useAdminRoleOptimized';
import { useRoleManagement } from './useRoleManagement';
import { toast } from 'sonner';

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
      
      // Log for monitoring
      console.log('Admin role check using new role system');
    }
  }, [newIsAdmin]);
  
  // Helper function to validate consistency between systems
  useEffect(() => {
    // Only run in development to help catch discrepancies during transition
    if (process.env.NODE_ENV === 'development' && !optimizedHook.isLoading && !newIsLoading) {
      const checkRoleConsistency = async () => {
        const isAdminOld = optimizedHook.isAdmin;
        const isAdminNew = await newIsAdmin();
        
        if (isAdminOld !== isAdminNew) {
          console.warn('Admin role inconsistency detected:', {
            oldSystem: isAdminOld,
            newSystem: isAdminNew
          });
        }
      };
      
      checkRoleConsistency();
    }
  }, [optimizedHook.isAdmin, optimizedHook.isLoading, newIsAdmin, newIsLoading]);
  
  // Return appropriate implementation based on feature flag
  return useNewRoleSystem ? 
    { 
      isAdmin: isAdminFromNew, 
      isLoading: newIsLoading,
      refreshAdminStatus: async () => {
        const isUserAdmin = await newIsAdmin();
        setIsAdminFromNew(isUserAdmin);
      },
      isUsingNewRoleSystem: true
    } : 
    {
      ...optimizedHook,
      isUsingNewRoleSystem: false
    };
}
