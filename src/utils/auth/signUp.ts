
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendUserToHubspot } from './hubspot';

// Updated return type to include user in success case
type SignUpResult = 
  | { error: null; success: true; user: User }
  | { error: Error; success: false; user?: undefined };

// Handle sign up with email and password
export async function signUpWithEmail(email: string, password: string, userData?: any): Promise<SignUpResult> {
  try {
    // If userData is provided, it means we're completing the final signup step
    const options = userData ? {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
      },
    } : {};

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      throw error;
    }
    
    // Ensure we have a user before proceeding
    if (!data.user) {
      throw new Error('Failed to create user account');
    }
    
    // If the signup was successful and we have a user, assign them as organization admin
    try {
      // First, set the user's role as organization_admin in the user_roles table
      // Find the organization_admin role ID first
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'organization_admin')
        .single();
        
      if (roleError || !roleData) {
        console.error('Error finding organization_admin role:', roleError);
      } else {
        // Add the user to the user_roles table with the organization_admin role
        const { error: roleAssignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role_id: roleData.id
          });
          
        if (roleAssignError) {
          console.error('Failed to assign organization_admin role:', roleAssignError);
        } else {
          console.log('Successfully assigned organization_admin role to new user');
        }
      }
      
      // Also create an organization membership record for the user
      // This makes them the admin of their own "organization"
      const { error: membershipError } = await supabase
        .from('organization_members')
        .insert({
          user_id: data.user.id,
          organization_id: data.user.id,
          role: 'organization_admin',
          is_primary: true
        });
        
      if (membershipError) {
        console.error('Error creating organization membership:', membershipError);
      } else {
        console.log('Created organization membership with admin role');
      }
    } catch (roleAssignmentError) {
      console.error('Exception during role assignment:', roleAssignmentError);
      // Don't block signup if role assignment fails
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
      } catch (hubspotError) {
        console.error('Failed to send user data to Hubspot:', hubspotError);
        // Don't block signup if Hubspot integration fails
      }
    }

    return { error: null, success: true, user: data.user };
  } catch (error) {
    console.error('Error signing up:', error);
    return { error: error as Error, success: false };
  }
}
