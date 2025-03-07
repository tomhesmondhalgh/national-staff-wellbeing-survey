
import { createClient } from "@supabase/supabase-js";

// Check if environment variables exist, otherwise use placeholders for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bagaaqkmewkuwtudwnqw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

// Create Supabase client with specific auto-refresh configuration and no redirects
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Explicitly disable built-in redirects to prevent them interfering with our custom handling
    flowType: 'pkce',
    detectSessionInUrl: false,
  },
});

// If you need to log conditionally, use this approach
console.info("Initializing Supabase with URL:", supabaseUrl.includes("placeholder") ? "placeholder-url" : supabaseUrl);

// Add a helper method to check if Supabase is configured properly
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "placeholder-url" && supabaseAnonKey !== "placeholder-key";
};

// Helper to check if the current session is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};
