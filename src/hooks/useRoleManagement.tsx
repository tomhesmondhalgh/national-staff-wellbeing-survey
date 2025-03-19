
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleType } from '@/lib/supabase/client';

/**
 * Hook to manage and check user roles using the simplified role system
 */
export function useRoleManagement() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  const [currentRole, setCurrentRole] = useState<UserRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the current user's role for the current organization
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setCurrentRole(null);
        setIsLoading(false);
        return;
      }

      // If in testing mode, use the testing role
      if (isTestingMode && testingRole) {
        console.log('Using testing role:', testingRole);
        setCurrentRole(testingRole as UserRoleType);
        setIsLoading(false);
        return;
      }
      
      // No organization selected
      if (!currentOrganization?.id) {
        setCurrentRole(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Call the database function to get the role
        const { data, error: roleError } = await supabase.rpc(
          'get_organization_role',
          { 
            user_uuid: user.id,
            org_id: currentOrganization.id 
          }
        );
        
        if (roleError) {
          console.error('Error fetching role:', roleError);
          setError(`Error fetching role: ${roleError.message}`);
          return;
        }
        
        console.log('Role from database:', data);
        setCurrentRole(data as UserRoleType);
      } catch (err: any) {
        console.error('Error in role fetch:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, currentOrganization, isTestingMode, testingRole]);

  // Helper function to format role names for display
  const formatRoleName = useCallback((role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Get the display name for a role
  const getRoleDisplayName = useCallback((roleName: string): string => {
    switch (roleName) {
      case 'administrator': return 'System Administrator';
      case 'organization_admin': return 'Organization Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return formatRoleName(roleName);
    }
  }, [formatRoleName]);

  return {
    currentRole,
    isLoading,
    error,
    getRoleDisplayName
  };
}
