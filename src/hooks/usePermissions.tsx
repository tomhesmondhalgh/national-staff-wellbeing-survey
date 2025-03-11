
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, supabase } from '../lib/supabase/client';
import { toast } from 'sonner';

// Update interfaces to match Supabase response structure
interface GroupOrganization {
  organization_id: string;
}

interface GroupData {
  group_organizations: GroupOrganization[];
}

interface GroupMembership {
  role: UserRoleType;
  group_id: string;
  groups: GroupData;
}

export function usePermissions() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);

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
          setQueryError("Error checking admin permissions");
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
        
        // DIRECT APPROACH: Check if the user is the profile owner of the organization
        // This handles the case where the organization ID is actually the user's profile ID
        if (currentOrganization.id === user.id) {
          console.log('User is the profile owner (organization admin)');
          setUserRole('organization_admin');
          setIsLoading(false);
          return;
        }
        
        try {
          // Check if user is organization admin for current organization
          const { data: orgMember, error: orgError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('organization_id', currentOrganization.id)
            .maybeSingle();
            
          if (orgError) {
            console.error('Error fetching organization role:', orgError);
            setQueryError("Error checking organization role");
            
            // If we get a recursion error, let's try a more direct SQL query using a function
            if (orgError.message.includes("infinite recursion")) {
              // FALLBACK: Handle RLS recursion by checking manually
              console.log('Detected recursion error, checking profile owner');
              
              // If the user is found in profiles with matching email and school_name
              const { data: profileMatch, error: profileError } = await supabase
                .from('profiles')
                .select('id, school_name')
                .eq('id', user.id)
                .maybeSingle();
                
              if (!profileError && profileMatch && 
                  profileMatch.school_name && 
                  currentOrganization.name === profileMatch.school_name) {
                console.log('User is the profile owner of this organization (via profile check)');
                setUserRole('organization_admin');
                setIsLoading(false);
                return;
              }
            }
          } else if (orgMember && orgMember.role) {
            console.log('User has organization role:', orgMember.role, 'for organization:', currentOrganization.name);
            setUserRole(orgMember.role as UserRoleType);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Exception in organization membership check:', err);
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
            setQueryError("Error checking group permissions");
          }
          
          console.log('Group roles data:', groupRoles);
          
          if (groupRoles && groupRoles.length > 0) {
            let foundRole = false;
            
            // First cast the data to unknown, then to our interface type to satisfy TypeScript
            const typedGroupRoles = groupRoles as unknown as GroupMembership[];
            
            for (const groupRole of typedGroupRoles) {
              if (groupRole.groups && groupRole.groups.group_organizations) {
                for (const groupOrg of groupRole.groups.group_organizations) {
                  if (groupOrg.organization_id === currentOrganization.id) {
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
        
        // ADDITIONAL FALLBACK: Check if the user's email matches a pending invitation
        // This could indicate they should have access but invitation wasn't properly processed
        try {
          if (user.email) {
            const { data: invitations, error: inviteError } = await supabase
              .from('invitations')
              .select('role, organization_id')
              .eq('email', user.email)
              .eq('organization_id', currentOrganization.id)
              .is('accepted_at', null)
              .gt('expires_at', new Date().toISOString());
              
            if (!inviteError && invitations && invitations.length > 0) {
              // User has a pending invitation for this organization
              console.log('User has pending invitation with role:', invitations[0].role);
              setUserRole(invitations[0].role as UserRoleType);
              // Optionally auto-accept invitation here
              setIsLoading(false);
              
              // Notify user of pending invitation
              toast.info(
                "You have a pending invitation to this organization. Your temporary role has been applied.",
                { duration: 5000 }
              );
              return;
            }
          }
        } catch (error) {
          console.error('Error checking invitations:', error);
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
    isAdmin,
    error: queryError
  };
}
