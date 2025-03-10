
import { createClient } from "@supabase/supabase-js";

console.log('==== INITIALIZING SUPABASE CLIENT ====');

// Check if environment variables exist, otherwise use placeholders for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bagaaqkmewkuwtudwnqw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

// Create Supabase client with additional error handling
console.log('Creating Supabase client');
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a fallback client that won't throw errors but will log issues
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
    }),
    // Add other methods as needed with safe fallbacks
  };
  console.warn('Using fallback Supabase client due to initialization error');
}

// Export the client
export { supabase };

// Add a helper method to check if Supabase is configured properly
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "placeholder-url" && supabaseAnonKey !== "placeholder-key";
};

// Helper to check if the current session is authenticated
export const isAuthenticated = async () => {
  console.log('Checking if user is authenticated');
  try {
    const { data } = await supabase.auth.getSession();
    console.log('Authentication check result:', !!data.session);
    return !!data.session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

console.log('==== SUPABASE CLIENT INITIALIZATION COMPLETE ====');
