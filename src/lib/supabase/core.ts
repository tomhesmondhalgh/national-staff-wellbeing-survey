
import { createClient } from "@supabase/supabase-js";

// Check if environment variables exist, otherwise use placeholders for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bagaaqkmewkuwtudwnqw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 15)}...`);

// Create Supabase client with auto-refresh and automatic retry
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => {
      return fetch(...args);
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// If you need to log conditionally, use this approach
console.info("Supabase client initialized");

// Add a helper method to check if Supabase is configured properly
export const isSupabaseConfigured = () => {
  const isUrlValid = supabaseUrl && 
                    supabaseUrl !== "placeholder-url" && 
                    supabaseUrl.includes("supabase.co");
  
  const isKeyValid = supabaseAnonKey && 
                     supabaseAnonKey !== "placeholder-key" && 
                     supabaseAnonKey.length > 20;
  
  console.log(`Supabase configuration check - URL valid: ${isUrlValid}, Key valid: ${isKeyValid}`);
  
  return isUrlValid && isKeyValid;
};

// Helper to check if the current session is authenticated
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error("Exception checking authentication:", error);
    return false;
  }
};

// Add event listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event}`, session ? "Session exists" : "No session");
});
