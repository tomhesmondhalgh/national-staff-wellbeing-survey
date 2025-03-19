
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define more specific return types for clarity and type safety
export type EnsureUserRoleSuccess = { 
  success: true; 
  roleAdded: boolean; 
  membershipAdded: boolean 
};

export type EnsureUserRoleNoUser = { 
  success: true; 
  noUser: true 
};

export type EnsureUserRoleFailure = { 
  success: false; 
  error: any 
};

// Combined type for all possible returns
export type EnsureUserRoleResult = 
  | EnsureUserRoleSuccess
  | EnsureUserRoleNoUser
  | EnsureUserRoleFailure;

/**
 * Ensures that a user has the organization_admin role
 * If they don't have a role, it adds the organization_admin role
 * Also ensures they have an organization_members record
 */
export async function ensureUserHasOrgAdminRole(userId: string): Promise<EnsureUserRoleResult> {
  try {
    // First check if the user already has any role in the user_roles table
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error('Error checking user roles:', rolesError);
      return { success: false, error: rolesError };
    }
    
    let roleAdded = false;
    
    // If the user doesn't have any roles, add the organization_admin role
    if (!existingRoles || existingRoles.length === 0) {
      // Get the organization_admin role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'organization_admin')
        .single();
        
      if (roleError || !roleData) {
        console.error('Error finding organization_admin role:', roleError);
        return { success: false, error: roleError };
      }
      
      // Assign the organization_admin role to the user
      const { error: roleAssignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id
        });
        
      if (roleAssignError) {
        console.error('Failed to assign organization_admin role:', roleAssignError);
        return { success: false, error: roleAssignError };
      }
      
      roleAdded = true;
      console.log('Successfully assigned organization_admin role to user');
    }
    
    // Now check if the user has an organization membership record
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', userId);
      
    if (membershipCheckError) {
      console.error('Error checking existing membership:', membershipCheckError);
      return { success: false, error: membershipCheckError };
    }
    
    let membershipAdded = false;
    
    // If no existing membership, create one with the user as their own organization admin
    if (!existingMembership || existingMembership.length === 0) {
      const { error: membershipError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: userId,
          role: 'organization_admin',
          is_primary: true
        });
        
      if (membershipError) {
        console.error('Error creating organization membership:', membershipError);
        return { success: false, error: membershipError };
      }
      
      membershipAdded = true;
      console.log('Created organization membership with admin role');
    }
    
    return { 
      success: true, 
      roleAdded,
      membershipAdded
    };
  } catch (error) {
    console.error('Error ensuring user has org admin role:', error);
    return { success: false, error };
  }
}

/**
 * Check and ensure all users have the organization_admin role
 * Returns statistics on how many users were updated
 */
export async function ensureAllUsersHaveOrgAdminRole() {
  try {
    // Get all users from the auth.users table via RPC
    // Note: This requires appropriate permissions on the Supabase project
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError };
    }
    
    if (!users || !users.users || users.users.length === 0) {
      return { success: true, message: 'No users found to process', stats: { total: 0 } };
    }
    
    const stats = {
      total: users.users.length,
      rolesAdded: 0,
      membershipsAdded: 0,
      errors: 0
    };
    
    // Process each user
    for (const user of users.users) {
      const result = await ensureUserHasOrgAdminRole(user.id);
      
      if (result.success && 'roleAdded' in result) {
        if (result.roleAdded) stats.rolesAdded++;
        if (result.membershipAdded) stats.membershipsAdded++;
      } else {
        stats.errors++;
      }
    }
    
    return { 
      success: true, 
      message: `Processed ${stats.total} users, added ${stats.rolesAdded} roles and ${stats.membershipsAdded} memberships`,
      stats
    };
  } catch (error) {
    console.error('Error processing all users:', error);
    return { success: false, error };
  }
}

/**
 * Function to be called on application startup to ensure the current user
 * has the organization_admin role
 */
export async function ensureCurrentUserHasOrgAdminRole(): Promise<EnsureUserRoleResult> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return { success: false, error: sessionError };
    }
    
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.log('No logged in user to check');
      return { success: true, noUser: true };
    }
    
    return await ensureUserHasOrgAdminRole(user.id);
  } catch (error) {
    console.error('Error checking current user role:', error);
    return { success: false, error };
  }
}
