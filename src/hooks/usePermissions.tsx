
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, supabase } from '../lib/supabase/client';

// Define interfaces for the group data structure
interface GroupOrganization {
  organization_id: string;
}

interface GroupMembership {
  role: UserRoleType;
  group_id: string;
  groups: {
    group_organizations: GroupOrganization[];
  };
}

export function usePermissions() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // If in testing mode with a role, use that role
      if (isTestingMode && testingRole) {
        console.log('Using testing role:', testingRole);
        setUserRole(testingRole as UserRoleType);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.email);
        
        // Check if user is system administrator
        const { data: adminRole, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'administrator')
          .maybeSingle();
          
        if (adminError) {
          console.error('Error checking admin role:', adminError);
        }
          
        if (adminRole) {
          console.log('User is administrator:', user.email);
          setUserRole('administrator');
          setIsLoading(false);
          return;
        }
        
        // If no organization is selected, we can't determine organization-specific roles
        if (!currentOrganization) {
          console.log('No organization selected, cannot determine organization role');
          setIsLoading(false);
          return;
        }
        
        console.log('Checking organization role for organization:', currentOrganization.name);
        
        // Check if user is organization admin for current organization
        const { data: orgMember, error: orgError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .maybeSingle();
          
        if (orgError) {
          console.error('Error fetching organization role:', orgError);
        }
        
        if (orgMember && orgMember.role) {
          console.log('User has organization role:', orgMember.role, 'for organization:', currentOrganization.name);
          setUserRole(orgMember.role as UserRoleType);
          setIsLoading(false);
          return;
        }
        
        console.log('Checking group-based access');
        
        // Check group-based access
        try {
          const { data: groupRoles, error: groupError } = await supabase
            .from('group_members')
            .select(`
              role,
              group_id,
              groups(
                group_organizations(organization_id)
              )
            `)
            .eq('user_id', user.id);
            
          if (groupError) {
            console.error('Error fetching group roles:', groupError);
          }
          
          console.log('Group roles data:', groupRoles);
          
          if (groupRoles && groupRoles.length > 0) {
            let foundRole = false;
            
            for (const groupRole of groupRoles) {
              // Check if groups and group_organizations exist and are properly structured
              if (groupRole.groups && 
                  typeof groupRole.groups === 'object' && 
                  groupRole.groups.group_organizations && 
                  Array.isArray(groupRole.groups.group_organizations)) {
                
                for (const groupOrg of groupRole.groups.group_organizations) {
                  if (groupOrg && 
                      typeof groupOrg === 'object' && 
                      'organization_id' in groupOrg && 
                      groupOrg.organization_id === currentOrganization.id) {
                    
                    console.log('User has group role:', groupRole.role, 'for organization:', currentOrganization.name);
                    setUserRole(groupRole.role as UserRoleType);
                    foundRole = true;
                    break;
                  }
                }
                
                if (foundRole) break;
              }
            }
            
            if (foundRole) {
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error in group membership check:', error);
        }
        
        // No role found
        console.log('No role found for user:', user.email);
        setUserRole(null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, currentOrganization, isTestingMode, testingRole]);

  // Function to check if user has at least the specified role
  const hasPermission = useCallback(async (requiredRole: UserRoleType): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode with a role, use that role for permission checks
    if (isTestingMode && testingRole) {
      console.log(`Testing mode permission check: ${testingRole} >= ${requiredRole}?`);
      const roleHierarchy: Record<UserRoleType, number> = {
        'administrator': 4,
        'group_admin': 3,
        'organization_admin': 2,
        'editor': 1,
        'viewer': 0
      };
      
      return roleHierarchy[testingRole as UserRoleType] >= roleHierarchy[requiredRole];
    }
    
    if (!currentOrganization) return false;
    
    // Always give permission to organization admins for their own organization
    if (userRole === 'organization_admin' && 
        (requiredRole === 'organization_admin' || requiredRole === 'editor' || requiredRole === 'viewer')) {
      return true;
    }
    
    // Always give permission to group admins
    if (userRole === 'group_admin') {
      return true;
    }
    
    // Always give permission to system administrators
    if (userRole === 'administrator') {
      return true;
    }
    
    // Check editor permissions
    if (userRole === 'editor' && (requiredRole === 'editor' || requiredRole === 'viewer')) {
      return true;
    }
    
    // Check viewer permissions
    if (userRole === 'viewer' && requiredRole === 'viewer') {
      return true;
    }
    
    return false;
  }, [user, currentOrganization, isTestingMode, testingRole, userRole]);

  // Common permission checks
  const canCreate = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canEdit = useCallback(async (): Promise<boolean> => hasPermission('editor'), [hasPermission]);
  
  const canManageTeam = useCallback(async (): Promise<boolean> => {
    // Organization admins should be able to manage team members
    if (userRole === 'organization_admin' || userRole === 'group_admin' || userRole === 'administrator') {
      return true;
    }
    
    // If in testing mode with appropriate admin role, allow team management
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin' || 
         testingRole === 'organization_admin')) {
      return true;
    }
    
    return false;
  }, [userRole, isTestingMode, testingRole]);
  
  // Check if user is a group admin
  const canManageGroups = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    // If in testing mode with group_admin role, return true
    if (isTestingMode && 
        (testingRole === 'administrator' || 
         testingRole === 'group_admin')) {
      return true;
    }
    
    // System administrators can manage groups
    if (userRole === 'administrator') {
      return true;
    }
    
    // Group admins can manage groups
    if (userRole === 'group_admin') {
      return true;
    }
    
    return false;
  }, [user, isTestingMode, testingRole, userRole]);
  
  const isAdmin = useCallback(async (): Promise<boolean> => {
    // If testing mode is on and user has administrator role in testing
    if (isTestingMode && testingRole === 'administrator') {
      return true;
    }
    
    // Check for administrator role
    if (userRole === 'administrator') {
      return true;
    }
    
    return false;
  }, [userRole, isTestingMode, testingRole]);

  return {
    userRole,
    isLoading,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam,
    canManageGroups,
    isAdmin
  };
}
