
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { UserRoleType, supabase } from '../lib/supabase';

export function useAdminRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isTestingMode, testingRole } = useTestingMode();

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // First, check if the user has the administrator role in the database
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'administrator')
          .maybeSingle();

        const isRealAdmin = !!data;

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // If user is a real admin, they should always have admin access
        if (isRealAdmin) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // If not a real admin but testing mode is enabled, check testing role
        if (isTestingMode && testingRole) {
          const isAdminInTestMode = testingRole === 'administrator' || 
                                   testingRole === 'group_admin' || 
                                   testingRole === 'organization_admin';
          setIsAdmin(isAdminInTestMode);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in admin role check:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [user, isTestingMode, testingRole]);

  return { isAdmin, isLoading };
}
