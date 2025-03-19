
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
        console.log('No organization selected, checking for user roles directly');
        try {
          // First try using the has_role_v2 RPC function
          const { data: hasAdminRole, error: adminCheckError } = await supabase.rpc(
            'has_role_v2',
            { 
              user_uuid: user.id,
              required_role: 'organization_admin'
            }
          );
          
          if (adminCheckError) {
            console.error('Error checking admin role with RPC:', adminCheckError);
          } else if (hasAdminRole) {
            console.log('User has organization_admin role (from RPC check)');
            setCurrentRole('organization_admin');
            setIsLoading(false);
            return;
          }
          
          // Fall back to direct query if RPC doesn't find the role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', user.id)
            .single();
            
          if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching user role:', roleError);
            setError(`Error fetching role: ${roleError.message}`);
          } else if (roleData?.roles?.name) {
            console.log('Found user role:', roleData.roles.name);
            setCurrentRole(roleData.roles.name as UserRoleType);
          } else {
            // Last resort: check if the user has a membership in organization_members
            const { data: membershipData, error: membershipError } = await supabase
              .from('organization_members')
              .select('role')
              .eq('user_id', user.id)
              .eq('organization_id', user.id) // Check for their personal organization
              .single();
              
            if (membershipError && membershipError.code !== 'PGRST116') {
              console.error('Error checking organization membership:', membershipError);
            } else if (membershipData?.role) {
              console.log('Found role from organization membership:', membershipData.role);
              setCurrentRole(membershipData.role as UserRoleType);
            } else {
              console.log('No role found for user');
              setCurrentRole(null);
            }
          }
        } catch (err: any) {
          console.error('Error in direct role check:', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
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
          setIsLoading(false);
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
