
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendUserToHubspot } from './hubspot';
import { toast } from 'sonner';

// Updated return type to include user in success case
type SignUpResult = 
  | { error: null; success: true; user: User }
  | { error: Error; success: false; user?: undefined };

// Handle sign up with email and password
export async function signUpWithEmail(email: string, password: string, userData?: any): Promise<SignUpResult> {
  try {
    console.log('Starting signUpWithEmail process for:', email);
    
    // If userData is provided, it means we're completing the final signup step
    const options = userData ? {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
      },
    } : {};

    // Step 1: Create the user account
    console.log('Step 1: Creating user account with Supabase auth.signUp');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      console.error('Supabase auth.signUp error:', error);
      throw error;
    }
    
    // Ensure we have a user before proceeding
    if (!data.user) {
      console.error('User creation failed: No user returned from auth.signUp');
      throw new Error('Failed to create user account');
    }
    
    console.log('User created successfully:', data.user.id);
    
    // Step 2: Get the role ID for organization_admin
    console.log('Step 2: Finding organization_admin role ID');
    try {
      // Pre-check: Does the role exist in the roles table?
      const { data: rolesCheck, error: rolesCheckError } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');
        
      if (rolesCheckError) {
        console.error('Error checking available roles:', rolesCheckError);
      } else {
        console.log('Available roles in database:', rolesCheck);
      }
    
      const { data: organizationAdminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'organization_admin')
        .single();
        
      if (roleError || !organizationAdminRole) {
        console.error('Error finding organization_admin role:', roleError);
        console.log('Available role data:', rolesCheck); // Log available roles again for reference
        throw new Error(`Failed to find organization_admin role: ${roleError?.message || 'Role not found'}`);
      }
      
      console.log('Found organization_admin role with ID:', organizationAdminRole.id);
      
      // Step 3: Assign the user to the organization_admin role
      console.log('Step 3: Assigning organization_admin role to user');
      const { error: roleAssignError, data: roleAssignData } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role_id: organizationAdminRole.id
        })
        .select();
          
      if (roleAssignError) {
        console.error('Failed to assign organization_admin role:', roleAssignError);
        throw new Error(`Failed to assign organization_admin role: ${roleAssignError.message}`);
      }
      
      console.log('Successfully assigned organization_admin role to new user:', roleAssignData);
      
      // Step 4: Create an organization membership record
      console.log('Step 4: Creating organization membership');
      const { error: membershipError, data: membershipData } = await supabase
        .from('organization_members')
        .insert({
          user_id: data.user.id,
          organization_id: data.user.id,  // The user ID is also their personal organization ID
          role: 'organization_admin',
          is_primary: true
        })
        .select();
        
      if (membershipError) {
        console.error('Error creating organization membership:', membershipError);
        throw new Error(`Failed to create organization membership: ${membershipError.message}`);
      }
      
      console.log('Created organization membership with admin role:', membershipData);
      
      // Step A: Verification - Check user_roles table
      const { data: verifyRole, error: verifyError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', data.user.id);
        
      if (verifyError) {
        console.error('Error verifying role assignment:', verifyError);
      } else {
        console.log('Role verification result:', verifyRole);
        if (!verifyRole?.length) {
          console.error('VERIFICATION FAILED: No roles found for user after assignment!');
        } else {
          console.log('VERIFICATION PASSED: User roles found:', verifyRole.length);
        }
      }
      
      // Step B: Verification - Check organization_members table
      const { data: verifyMembership, error: verifyMembershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', data.user.id);
        
      if (verifyMembershipError) {
        console.error('Error verifying organization membership:', verifyMembershipError);
      } else {
        console.log('Membership verification result:', verifyMembership);
        if (!verifyMembership?.length) {
          console.error('VERIFICATION FAILED: No organization memberships found for user!');
        } else {
          console.log('VERIFICATION PASSED: User memberships found:', verifyMembership.length);
        }
      }
      
    } catch (roleAssignmentError: any) {
      console.error('Exception during role assignment:', roleAssignmentError);
      // Don't block signup if role assignment fails, but log it clearly
      console.error(`Role assignment failed with message: ${roleAssignmentError.message}`);
      // We don't throw here to allow sign up to complete even if role assignment fails
    }
    
    // If we have user data, send it to Hubspot
    if (userData && data.user) {
      try {
        await sendUserToHubspot({
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
        console.log('User data sent to Hubspot');
      } catch (hubspotError: any) {
        console.error('Failed to send user data to Hubspot:', hubspotError);
        // Don't block signup if Hubspot integration fails
      }
    }

    return { error: null, success: true, user: data.user };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { error: error as Error, success: false };
  }
}
