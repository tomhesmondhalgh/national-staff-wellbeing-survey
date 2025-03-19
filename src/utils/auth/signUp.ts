
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
    
    // In the simplified authentication model, we don't need to assign roles
    // All authenticated users have the same permissions
    
    // Set up the user profile
    try {
      console.log('Setting up user profile');
      const { error: profileError } = await supabase.rpc(
        'create_or_update_profile',
        {
          profile_id: data.user.id,
          profile_first_name: userData?.firstName || '',
          profile_last_name: userData?.lastName || '',
          profile_job_title: userData?.jobTitle || '',
          profile_school_name: userData?.schoolName || '',
          profile_school_address: userData?.schoolAddress || ''
        }
      );
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't block signup on profile creation failure
        console.warn('Profile creation failed but continuing with signup');
      } else {
        console.log('Created user profile successfully');
      }
    } catch (profileError) {
      console.error('Exception during profile creation:', profileError);
      // Don't block signup on profile creation failure
      console.warn('Profile creation failed but continuing with signup');
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
