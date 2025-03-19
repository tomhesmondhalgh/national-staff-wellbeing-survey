
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Handle sign out
export async function signOutUser() {
  try {
    // Clear testing mode by removing from localStorage explicitly
    localStorage.removeItem('testing_mode_enabled');
    localStorage.removeItem('testing_mode_plan');
    localStorage.removeItem('testing_mode_role');
    
    // Clear any cached auth data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth') || key.includes('sb-'))) {
        localStorage.removeItem(key);
      }
    }
    
    await supabase.auth.signOut();
    toast({
      title: 'Success',
      description: 'Signed out successfully'
    });
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
