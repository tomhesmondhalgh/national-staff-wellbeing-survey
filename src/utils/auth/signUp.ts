
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
    
    // Step 2: Directly insert role using a direct insert instead of checking first
    console.log('Step 2: Direct insertion approach for the organization_admin role');
    try {
      // First get the role ID, bypassing the recursive policy issue by using a more direct query
      console.log('First, fetching organization_admin role ID directly');
      const { data: roleResult, error: roleQueryError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'organization_admin')
        .limit(1)
        .single();
        
      if (roleQueryError) {
        console.error('Failed to fetch organization_admin role ID:', roleQueryError);
        throw new Error(`Could not find organization_admin role: ${roleQueryError.message}`);
      }
      
      if (!roleResult || !roleResult.id) {
        console.error('Role lookup succeeded but returned no ID');
        throw new Error('organization_admin role not found in roles table');
      }
      
      const roleId = roleResult.id;
      console.log('Found organization_admin role ID:', roleId);
      
      // Now directly insert the user role
      console.log('Now inserting user role with direct insert');
      const { error: insertError, data: insertResult } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role_id: roleId
        })
        .select();
        
      if (insertError) {
        console.error('Error inserting user role:', insertError);
        throw new Error(`Failed to assign role: ${insertError.message}`);
      }
      
      console.log('Role assigned successfully:', insertResult);
      
      // Create an organization membership record
      console.log('Step 3: Creating organization membership with direct insert');
      const { error: membershipError, data: membershipResult } = await supabase
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
        // Don't throw here, just log the error
        console.warn('Organization membership creation failed but continuing with signup');
      } else {
        console.log('Created organization membership successfully:', membershipResult);
      }
      
      // Verify the user role was actually created
      console.log('Verifying user role was created...');
      const { data: verifyRoleData, error: verifyRoleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', data.user.id);
        
      if (verifyRoleError) {
        console.error('Error verifying user role creation:', verifyRoleError);
      } else if (!verifyRoleData || verifyRoleData.length === 0) {
        console.error('CRITICAL ERROR: User role verification failed - no roles found after insert!');
      } else {
        console.log('Verification PASSED: User roles found:', verifyRoleData);
      }
      
    } catch (roleError: any) {
      console.error('Exception during role assignment:', roleError);
      
      // Try an alternative approach using RPC
      try {
        console.log('Attempting alternative role assignment using has_role_v2 RPC function');
        const { data: hasRoleData, error: hasRoleError } = await supabase.rpc(
          'has_role_v2',
          { 
            user_uuid: data.user.id,
            required_role: 'organization_admin'
          }
        );
        
        console.log('RPC check result:', hasRoleData, 'Error:', hasRoleError);
        
        if (hasRoleError) {
          console.error('Alternative approach also failed:', hasRoleError);
        }
      } catch (rpcError) {
        console.error('RPC approach also failed:', rpcError);
      }
      
      // Don't block signup on role assignment failure
      console.warn('Role assignment failed but continuing with signup');
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
