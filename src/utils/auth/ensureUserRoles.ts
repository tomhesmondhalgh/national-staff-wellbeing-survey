
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
  error: any;
  errorSource?: string;
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
    console.log('Starting ensureUserHasOrgAdminRole for user:', userId);
    
    // First check if the user already has any role in the user_roles table
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error('Error checking user roles:', rolesError);
      return { success: false, error: rolesError, errorSource: 'checking_roles' };
    }
    
    let roleAdded = false;
    
    // If the user doesn't have any roles, add the organization_admin role
    if (!existingRoles || existingRoles.length === 0) {
      console.log('No existing roles found, will add organization_admin role');
      
      // Get the organization_admin role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'organization_admin')
        .single();
        
      if (roleError || !roleData) {
        console.error('Error finding organization_admin role:', roleError);
        return { success: false, error: roleError, errorSource: 'finding_role' };
      }
      
      console.log('Found organization_admin role with ID:', roleData.id);
      
      // Assign the organization_admin role to the user
      const { error: roleAssignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id
        });
        
      if (roleAssignError) {
        console.error('Failed to assign organization_admin role:', roleAssignError);
        return { success: false, error: roleAssignError, errorSource: 'assigning_role' };
      }
      
      roleAdded = true;
      console.log('Successfully assigned organization_admin role to user');
    } else {
      console.log('User already has roles:', existingRoles.length);
    }
    
    // CRITICAL FIX: Use a direct select query instead of count to avoid RLS recursion
    console.log('Checking if user has organization membership record');
    
    // Use a custom RPC function to check membership existence safely
    // This function was created as a SECURITY DEFINER to bypass RLS policies
    const { data, error: membershipError } = await supabase.rpc<boolean>(
      'check_organization_membership_exists',
      { 
        user_uuid: userId,
        org_uuid: userId
      }
    );
    
    if (membershipError) {
      console.error('Error checking membership existence with RPC:', membershipError);
      // Fall back to a direct query as last resort
      const { data: directCheckData, error: directCheckError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', userId)
        .maybeSingle();
      
      if (directCheckError) {
        console.error('Error checking membership with direct query:', directCheckError);
        return { 
          success: false, 
          error: directCheckError, 
          errorSource: 'checking_membership_direct' 
        };
      }
      
      // If the direct check worked, continue with that result
      if (directCheckData) {
        console.log('User already has membership record (direct check):', directCheckData.id);
        return { 
          success: true, 
          roleAdded,
          membershipAdded: false
        };
      }
    }
    
    let membershipAdded = false;
    const membershipExists = data === true;
    
    // If no existing membership, create one with the user as their own organization admin
    if (!membershipExists) {
      console.log('No existing membership found, creating one');
      const { error: createMembershipError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: userId,
          role: 'organization_admin',
          is_primary: true
        });
        
      if (createMembershipError) {
        console.error('Error creating organization membership:', createMembershipError);
        return { 
          success: false, 
          error: createMembershipError, 
          errorSource: 'creating_membership' 
        };
      }
      
      membershipAdded = true;
      console.log('Created organization membership with admin role');
    } else {
      console.log('User already has membership record (RPC check)');
    }
    
    console.log('Successfully completed ensureUserHasOrgAdminRole');
    return { 
      success: true, 
      roleAdded,
      membershipAdded
    };
  } catch (error) {
    console.error('Exception in ensureUserHasOrgAdminRole:', error);
    return { success: false, error, errorSource: 'unexpected_exception' };
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
    console.log('Starting ensureCurrentUserHasOrgAdminRole');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return { success: false, error: sessionError, errorSource: 'getting_session' };
    }
    
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.log('No logged in user to check');
      return { success: true, noUser: true };
    }
    
    console.log('Found logged in user:', user.id);
    return await ensureUserHasOrgAdminRole(user.id);
  } catch (error) {
    console.error('Exception in ensureCurrentUserHasOrgAdminRole:', error);
    return { success: false, error, errorSource: 'unexpected_exception' };
  }
}
