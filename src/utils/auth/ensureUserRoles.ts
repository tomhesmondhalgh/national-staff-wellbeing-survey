
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Updated type definitions for simplified model
export type EnsureUserResult = 
  | { success: true; message: string }
  | { success: false; error: any; };

/**
 * This is a simplified version of the previous ensureUserHasOrgAdminRole function
 * Now it just checks if a user exists and has a profile
 */
export async function ensureUserHasProfile(userId: string): Promise<EnsureUserResult> {
  try {
    console.log('Starting ensureUserHasProfile for user:', userId);
    
    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking user profile:', profileError);
      return { success: false, error: profileError };
    }
    
    // If profile doesn't exist, create a basic one
    if (!profile) {
      console.log('No profile found, creating a basic one');
      
      const { error: createProfileError } = await supabase.rpc(
        'create_or_update_profile',
        {
          profile_id: userId,
          profile_first_name: '',
          profile_last_name: '',
          profile_job_title: '',
          profile_school_name: '',
          profile_school_address: ''
        }
      );
        
      if (createProfileError) {
        console.error('Error creating basic profile:', createProfileError);
        return { success: false, error: createProfileError };
      }
      
      console.log('Created basic profile for user');
      return { success: true, message: 'Created basic profile for user' };
    }
    
    return { success: true, message: 'User profile exists' };
  } catch (error) {
    console.error('Exception in ensureUserHasProfile:', error);
    return { success: false, error };
  }
}

/**
 * Simplified version of ensureAllUsersHaveOrgAdminRole
 * Now it just ensures all users have profiles
 */
export async function ensureAllUsersHaveProfiles() {
  try {
    // Get all users from the auth.users table
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, error };
    }
    
    if (!data || !data.users || data.users.length === 0) {
      return { success: true, message: 'No users found to process', stats: { total: 0 } };
    }
    
    const stats = {
      total: data.users.length,
      profilesCreated: 0,
      errors: 0
    };
    
    // Process each user
    for (const user of data.users) {
      const result = await ensureUserHasProfile(user.id);
      
      if (result.success) {
        if (result.message.includes('Created')) stats.profilesCreated++;
      } else {
        stats.errors++;
      }
    }
    
    return { 
      success: true, 
      message: `Processed ${stats.total} users, created ${stats.profilesCreated} profiles`,
      stats
    };
  } catch (error) {
    console.error('Error processing all users:', error);
    return { success: false, error };
  }
}

/**
 * Simplified version of ensureCurrentUserHasOrgAdminRole
 * Now it just ensures the current user has a profile
 */
export async function ensureCurrentUserHasProfile(): Promise<EnsureUserResult> {
  try {
    console.log('Starting ensureCurrentUserHasProfile');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { success: false, error };
    }
    
    const user = data?.session?.user;
    
    if (!user) {
      console.log('No logged in user to check');
      return { success: true, message: 'No logged in user to check' };
    }
    
    console.log('Found logged in user:', user.id);
    return await ensureUserHasProfile(user.id);
  } catch (error) {
    console.error('Exception in ensureCurrentUserHasProfile:', error);
    return { success: false, error };
  }
}
