
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendUserToHubspot } from './hubspot';

// Handle sign up with email and password
export async function signUpWithEmail(email: string, password: string, userData?: any) {
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
    
    // If the signup was successful and we have a user, assign them as organization admin
    if (data.user) {
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
      } catch (roleAssignmentError) {
        console.error('Exception during role assignment:', roleAssignmentError);
        // Don't block signup if role assignment fails
      }
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
