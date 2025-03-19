
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Handle sign out
export async function signOutUser() {
  try {
    console.log('Starting sign out process');
    
    // Clear testing mode by removing from localStorage explicitly
    localStorage.removeItem('testing_mode_enabled');
    localStorage.removeItem('testing_mode_plan');
    localStorage.removeItem('testing_mode_role');
    
    // Clear any cached auth data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth') || key.includes('sb-'))) {
        console.log('Removing auth-related item from localStorage:', key);
        localStorage.removeItem(key);
      }
    }
    
    // Clear session cookies if present
    document.cookie.split(';').forEach(function(c) {
      if (c.trim().startsWith('sb-')) {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        console.log('Removed cookie:', c.trim());
      }
    });
    
    // Sign out from Supabase
    console.log('Calling supabase.auth.signOut()');
    await supabase.auth.signOut();
    console.log('Supabase sign out complete');
    
    toast({
      title: 'Success',
      description: 'Signed out successfully'
    });
    
    // Extra measure: force page reload to clear any in-memory state
    console.log('Sign out successful, returning result');
    return { error: null, success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    toast({
      title: 'Error',
      description: 'Error signing out',
      variant: 'destructive'
    });
    return { error: error as Error, success: false };
  }
}
