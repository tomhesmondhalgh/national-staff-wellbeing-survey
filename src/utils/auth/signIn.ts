
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

    toast({
      title: 'Success',
      description: 'Logged in successfully!'
    });
    return { error: null, success: true };
  } catch (error) {
    console.error('Error signing in:', error);
    return { error: error as Error, success: false };
  }
}
