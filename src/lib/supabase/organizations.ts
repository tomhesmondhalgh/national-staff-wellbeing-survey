
import { supabase } from './core';
import { Group, GroupOrganization, Organization, UserRoleType } from './types';

// Get all groups the current user belongs to
export const getUserGroups = async (): Promise<Group[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups(*)
    `)
    .eq('user_id', user.user.id);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // Extract and transform the data to match the Group interface
  return (data || []).map(item => {
    // Ensure groups is an object with the required properties
    if (item.groups && 
        typeof item.groups === 'object' && 
        !Array.isArray(item.groups) &&
        'id' in item.groups && 
        'name' in item.groups && 
        'created_at' in item.groups &&
        'updated_at' in item.groups) {
      return item.groups as Group;
    }
    // Return a default Group object if data is not as expected
    console.warn('Group data is missing or malformed:', item);
    return null;
  }).filter((group): group is Group => group !== null);
};

// Get all organizations the current user belongs to
export const getUserOrganizations = async (): Promise<Organization[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  // Try to get the user profile as an organization (for organization admins)
  // This is needed for organization admins who are not part of multiple organizations
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
  }

  // If the user is an organization admin and has school_name, create an organization from their profile
  const organizations: Organization[] = [];
  
  // First check: if they have a profile with a school_name, add it as an organization
  if (userProfile && userProfile.school_name) {
    organizations.push({
      id: userProfile.id,
      name: userProfile.school_name,
      created_at: userProfile.created_at || new Date().toISOString()
    });
    
    // Also check if we need to add them as an organization_admin
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('organization_id', userProfile.id)
      .single();
      
    if (!existingMember) {
      // Create organization_member record to make them an admin of their own organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: userProfile.id,
          user_id: user.user.id,
          role: 'organization_admin',
          is_primary: true
        });
        
      if (memberError) {
        console.error('Error creating organization membership:', memberError);
      } else {
        console.log('Successfully created organization admin membership for user');
      }
    }
  }

  // Then check group memberships for additional organizations
  try {
    const { data: groupOrgs, error: groupError } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group_organizations!inner(
          organization_id,
          profiles:organization_id(*)
        )
      `)
      .eq('user_id', user.user.id);

    if (groupError) {
      console.error('Error fetching group-based organization memberships:', groupError);
    } else if (groupOrgs && Array.isArray(groupOrgs)) {
      // Process the response more safely
      groupOrgs.forEach(item => {
        if (item.group_organizations && Array.isArray(item.group_organizations)) {
          item.group_organizations.forEach(go => {
            // Safe check for profiles - ensure it's not an array before treating as an object
            if (go.profiles && typeof go.profiles === 'object' && !Array.isArray(go.profiles)) {
              const profile = go.profiles as Record<string, any>;
              // Check if we have the minimum required data
              if (profile.id && profile.created_at) {
                // Only add organizations that aren't already in our list
                if (!organizations.some(o => o.id === go.organization_id)) {
                  // Use school_name if available, fallback to name, or use unknown
                  const orgName = profile.school_name || profile.name || 'Unknown Organization';
                  organizations.push({
                    id: profile.id,
                    name: orgName,
                    created_at: profile.created_at
                  });
                }
              }
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing group organizations:', error);
  }

  return organizations;
};

// Get user's role for a specific organization
export const getUserRoleForOrganization = async (organizationId: string): Promise<UserRoleType | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  
  // Check if user is system admin
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.user.id)
    .eq('role', 'administrator')
    .maybeSingle();
    
  if (adminRole) return 'administrator';
  
  // If the user is looking at their own organization profile
  if (user.user.id === organizationId) {
    return 'organization_admin';
  }
  
  // Check group-based access
  const { data: groupRoles } = await supabase
    .from('group_members')
    .select(`
      role,
      group_id,
      group_organizations!inner(organization_id)
    `)
    .eq('user_id', user.user.id);
    
  if (groupRoles) {
    for (const groupRole of groupRoles) {
      if (groupRole.group_organizations && Array.isArray(groupRole.group_organizations)) {
        for (const groupOrg of groupRole.group_organizations) {
          if (groupOrg.organization_id === organizationId) {
            return groupRole.role as UserRoleType;
          }
        }
      }
    }
  }
  
  return null;
};

// Check if user has specific permission for an organization
export const userHasPermission = async (
  organizationId: string, 
  requiredRole: UserRoleType
): Promise<boolean> => {
  const userRole = await getUserRoleForOrganization(organizationId);
  if (!userRole) return false;
  
  const roleHierarchy: Record<UserRoleType, number> = {
    'administrator': 4,
    'group_admin': 3,
    'organization_admin': 2,
    'editor': 1,
    'viewer': 0
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
