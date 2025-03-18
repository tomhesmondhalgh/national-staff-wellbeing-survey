
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, supabase } from '../lib/supabase/client';
import { toast } from 'sonner';

export function useRoleFetcher() {
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
        
        // Check direct organization membership
        const { data: orgMember, error: orgError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', currentOrganization.id)
          .maybeSingle();
          
        if (orgError) {
          console.error('Error checking organization membership:', orgError);
          setQueryError("Error checking organization membership");
        }
        
        if (orgMember) {
          console.log('User has organization role:', orgMember.role);
          setUserRole(orgMember.role as UserRoleType);
          setIsLoading(false);
          return;
        }
        
        // DIRECT APPROACH: Check if the user is the profile owner of the organization
        // This handles the case where the organization ID is actually the user's profile ID
        if (currentOrganization.id === user.id) {
          console.log('User is the profile owner (organization admin)');
          setUserRole('organization_admin');
          setIsLoading(false);
          return;
        }
        
        try {
          // Use RPC function to avoid recursion issues when checking organization membership
          const { data: orgRole, error: orgRpcError } = await supabase
            .rpc('get_user_organization_role', {
              user_uuid: user.id,
              org_id: currentOrganization.id
            });
            
          if (orgRpcError) {
            console.error('Error fetching organization role via RPC:', orgRpcError);
            setQueryError("Error checking organization role");
          } else if (orgRole) {
            console.log('User has organization role:', orgRole, 'for organization:', currentOrganization.name);
            setUserRole(orgRole as UserRoleType);
            setIsLoading(false);
            return;
          } else {
            console.log('No direct organization role found, checking group-based access');
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
            const typedGroupRoles = groupRoles as unknown as {
              role: UserRoleType;
              group_id: string;
              groups: {
                group_organizations: { organization_id: string }[];
              };
            }[];
            
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
                "You have a pending invitation to this organisation. Your temporary role has been applied.",
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

  return { userRole, isLoading, queryError };
}
