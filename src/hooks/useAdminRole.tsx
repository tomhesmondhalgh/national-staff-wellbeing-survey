
import { useState, useEffect } from 'react';
import { useRoleManagement } from './useRoleManagement';

export function useAdminRole() {
  // Use the new implementation directly
  const { isAdmin, isLoading } = useRoleManagement();
  
  // State to track admin status
  const [isAdminStatus, setIsAdminStatus] = useState(false);
  
  // Check admin status when the component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isUserAdmin = await isAdmin();
      setIsAdminStatus(isUserAdmin);
    };
    
    checkAdminStatus();
    console.log('Admin role check using new role system exclusively');
  }, [isAdmin]);
  
  // Return simplified implementation
  return { 
    isAdmin: isAdminStatus, 
    isLoading,
    refreshAdminStatus: async () => {
      const isUserAdmin = await isAdmin();
      setIsAdminStatus(isUserAdmin);
    }
  };
}
