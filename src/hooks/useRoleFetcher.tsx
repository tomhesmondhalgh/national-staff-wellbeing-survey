import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { UserRoleType, supabase } from '../lib/supabase/client';
import { toast } from 'sonner';

interface GroupOrganization {
  organization_id: string;
}

interface GroupData {
  id: string;
  name: string;
  group_organizations?: GroupOrganization[];
}

interface GroupRoleResponse {
  role: string;
  group_id: string;
  groups: GroupData[] | null;
}

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

      if (isTestingMode && testingRole) {
        console.log('Using testing role:', testingRole);
        setUserRole(testingRole as UserRoleType);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.email);
        
        if (user) {
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
          
          if (!currentOrganization) {
            console.log('No organization selected, cannot determine organization role');
            setIsLoading(false);
            return;
          }
          
          console.log('Checking organization role for organization:', currentOrganization.name);
          
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
          
          if (currentOrganization.id === user.id) {
            console.log('User is the profile owner (organization admin)');
            setUserRole('organization_admin');
            setIsLoading(false);
            return;
          }
          
          console.log('Checking group-based access directly');
          
          const { data: groupRoles, error: groupError } = await supabase
            .from('group_members')
            .select(`
              role,
              group_id,
              groups(
                id,
                name,
                group_organizations(organization_id)
              )
            `)
            .eq('user_id', user.id);
          
          if (groupError) {
            console.error('Error fetching group roles:', groupError);
            setQueryError("Error checking group permissions");
          }
          
          if (groupRoles && groupRoles.length > 0) {
            console.log('Group roles found:', groupRoles.length);
            
            let highestRole: UserRoleType | null = null;
            const roleHierarchy: Record<UserRoleType, number> = {
              'administrator': 4,
              'group_admin': 3,
              'organization_admin': 2,
              'editor': 1,
              'viewer': 0
            };
            
            for (const groupRole of groupRoles as unknown as GroupRoleResponse[]) {
              if (groupRole.groups && Array.isArray(groupRole.groups) && groupRole.groups.length > 0) {
                for (const group of groupRole.groups) {
                  if (group && 
                      typeof group === 'object' && 
                      'group_organizations' in group && 
                      Array.isArray(group.group_organizations)) {
                    
                    for (const groupOrg of group.group_organizations) {
                      if (groupOrg && 
                          typeof groupOrg === 'object' && 
                          'organization_id' in groupOrg && 
                          groupOrg.organization_id === currentOrganization.id) {
                        
                        console.log('Found group role for organization:', groupRole.role);
                        
                        if (!highestRole || 
                            (groupRole.role as UserRoleType in roleHierarchy && 
                             roleHierarchy[groupRole.role as UserRoleType] > roleHierarchy[highestRole])) {
                          highestRole = groupRole.role as UserRoleType;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            if (highestRole) {
              console.log('Using highest group role:', highestRole);
              setUserRole(highestRole);
              setIsLoading(false);
              return;
            }
          }
          
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
                console.log('User has pending invitation with role:', invitations[0].role);
                setUserRole(invitations[0].role as UserRoleType);
                setIsLoading(false);
                
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
          
          console.log('No role found for user:', user.email);
          setUserRole(null);
        }
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
