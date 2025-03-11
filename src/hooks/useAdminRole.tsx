
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

      // If testing mode is enabled with a role, use that
      if (isTestingMode && testingRole) {
        const isAdminInTestMode = testingRole === 'administrator' || 
                                 testingRole === 'group_admin' || 
                                 testingRole === 'organization_admin';
        setIsAdmin(isAdminInTestMode);
        setIsLoading(false);
        return;
      }

      try {
        // Check if the user has the administrator role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'administrator')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
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
