import { User, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Handle sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if the error is related to email confirmation
      if (error.message.includes('Email not confirmed') || 
          error.message.toLowerCase().includes('email confirmation')) {
        return { 
          error: {
            ...error,
            message: 'Please confirm your email address before logging in. Check your inbox for a confirmation link.',
            isEmailConfirmationError: true
          }, 
          success: false 
        };
      }
      throw error;
    }

    toast.success('Logged in successfully!');
    return { error: null, success: true };
  } catch (error) {
    console.error('Error signing in:', error);
    return { error: error as Error, success: false };
  }
}

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

// Handle sign out
export async function signOutUser() {
  try {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    return { error: null, success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Error signing out');
    return { error: error as Error, success: false };
  }
}

// Handle sign in with social provider
export async function signInWithSocialProvider(provider: Provider) {
  try {
    console.log(`Initiating sign in with ${provider}`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: provider === 'azure' ? 'email profile openid' : undefined,
      },
    });

    if (error) {
      console.error(`Social sign-in error with ${provider}:`, error);
      throw error;
    }

    return { error: null, success: true };
  } catch (error) {
    console.error(`Detailed error signing in with ${provider}:`, error);
    toast.error(`Failed to sign in with ${provider}`);
    return { error: error as Error, success: false };
  }
}

// Handle profile completion
export async function completeUserProfile(userId: string, userData: any) {
  try {
    // Update user metadata with school information
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        job_title: userData.jobTitle,
        school_name: userData.schoolName,
        school_address: userData.schoolAddress,
      },
    });

    if (metadataError) {
      throw metadataError;
    }

    // Use service role to bypass RLS policies for initial profile creation
    const { error: profileError } = await supabase.rpc('create_or_update_profile', {
      profile_id: userId,
      profile_first_name: userData.firstName,
      profile_last_name: userData.lastName,
      profile_job_title: userData.jobTitle,
      profile_school_name: userData.schoolName,
      profile_school_address: userData.schoolAddress,
    });

    if (profileError) {
      throw profileError;
    }

    // Send welcome email to the user
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          schoolName: userData.schoolName,
        },
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the signup if the welcome email fails
    }
    
    // Send admin notification email
    try {
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          jobTitle: userData.jobTitle,
          schoolName: userData.schoolName,
          schoolAddress: userData.schoolAddress,
        },
      });
      console.log('Admin notification email sent successfully');
    } catch (adminEmailError) {
      console.error('Error sending admin notification email:', adminEmailError);
      // Don't fail the signup if the admin notification email fails
    }
    
    // Send user data to Hubspot
    try {
      await sendUserToHubspot(userData);
      console.log('User profile data sent to Hubspot');
    } catch (hubspotError) {
      console.error('Error sending user profile to Hubspot:', hubspotError);
      // Don't fail the signup if Hubspot integration fails
    }

    toast.success('Account setup completed successfully!', {
      description: 'Please check your email to confirm your account.'
    });
    
    return { error: null, success: true };
  } catch (error) {
    console.error('Error completing user profile:', error);
    return { error: error as Error, success: false };
  }
}

// Function to send user data to Hubspot
export async function sendUserToHubspot(userData: any, listId: string = '5417', knownHubspotId?: string) {
  console.log(`Sending user data to Hubspot for list ID: ${listId}`, userData);
  
  try {
    const response = await supabase.functions.invoke('hubspot-integration', {
      body: {
        userData: {
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          jobTitle: userData.jobTitle || '',
          schoolName: userData.schoolName || '',
          schoolAddress: userData.schoolAddress || '',
          knownHubspotId: knownHubspotId
        },
        listId: listId // Use the passed listId parameter 
      }
    });

    if (response.error) {
      console.error('Hubspot integration error:', response.error);
      throw new Error(`Hubspot integration failed: ${response.error.message}`);
    }

    console.log('Successful response from Hubspot integration:', response.data);
    return response.data;
  } catch (error) {
    console.error('Exception in sendUserToHubspot:', error);
    throw error;
  }
}
