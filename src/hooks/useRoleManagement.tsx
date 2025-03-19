
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '@/lib/supabase/client';
import { UserRoleType } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to manage and check user roles using the new role system
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

  /**
   * Check if the current user has at least the required role
   */
  const hasPermission = useCallback(async (requiredRole: UserRoleType): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode, directly compare role hierarchies
    if (isTestingMode && testingRole) {
      const roleHierarchy: Record<UserRoleType, number> = {
        'administrator': 100,
        'group_admin': 80,
        'organization_admin': 60,
        'editor': 40,
        'viewer': 20
      };
      
      return (roleHierarchy[testingRole as UserRoleType] || 0) >= (roleHierarchy[requiredRole] || 0);
    }
    
    if (!currentOrganization?.id) return false;
    
    try {
      // Use the new v2 database function to check permissions
      const { data, error: permError } = await supabase.rpc(
        'user_has_organization_role_v2',
        {
          user_uuid: user.id,
          org_id: currentOrganization.id,
          required_role: requiredRole
        }
      );
      
      if (permError) {
        console.error('Error checking permission:', permError);
        return false;
      }
      
      return !!data;
    } catch (err) {
      console.error('Error in permission check:', err);
      return false;
    }
  }, [user, currentOrganization, isTestingMode, testingRole]);

  /**
   * Get the display name for a role
   */
  const getRoleDisplayName = useCallback(async (roleName: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('display_name')
        .eq('name', roleName)
        .single();
      
      if (error) {
        console.error('Error fetching role display name:', error);
        return formatRoleName(roleName);
      }
      
      return data.display_name;
    } catch (err) {
      console.error('Error getting role display name:', err);
      return formatRoleName(roleName);
    }
  }, []);
  
  // Helper function to format role names as a fallback
  const formatRoleName = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Common permission checks as convenience methods
  const canCreate = useCallback(async (): Promise<boolean> => 
    hasPermission('editor'), [hasPermission]);
  
  const canEdit = useCallback(async (): Promise<boolean> => 
    hasPermission('editor'), [hasPermission]);
  
  const canManageTeam = useCallback(async (): Promise<boolean> => 
    hasPermission('organization_admin'), [hasPermission]);
  
  const canManageGroups = useCallback(async (): Promise<boolean> => 
    hasPermission('group_admin'), [hasPermission]);
  
  const isAdmin = useCallback(async (): Promise<boolean> => 
    hasPermission('administrator'), [hasPermission]);

  return {
    currentRole,
    isLoading,
    error,
    hasPermission,
    getRoleDisplayName,
    // Convenience methods
    canCreate,
    canEdit,
    canManageTeam,
    canManageGroups,
    isAdmin
  };
}
