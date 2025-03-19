
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authCheckComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; success: boolean }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any; success: boolean; user?: User }>;
  signOut: () => Promise<void>;
  completeUserProfile: (userData: any) => Promise<{ error: any; success: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  authCheckComplete: false,
  signIn: async () => ({ error: null, success: false }),
  signUp: async () => ({ error: null, success: false }),
  signOut: async () => {},
  completeUserProfile: async () => ({ error: null, success: false }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Unexpected error during session check:', error);
      } finally {
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    };

    getInitialSession();

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setAuthCheckComplete(true);
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast.success('Logged in successfully');
      return { error: null, success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function - uses our simplified approach without roles
  const signUp = async (email: string, password: string, userData?: any) => {
    setIsLoading(true);
    try {
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
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('Failed to create user account');
      }
      
      // In our simplified model, we don't assign any roles
      
      toast.success('Account created successfully');
      return { error: null, success: true, user: data.user };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const completeUserProfile = async (userData: any) => {
    try {
      const { error } = await supabase.rpc('create_or_update_profile', {
        profile_id: user?.id,
        profile_first_name: userData.firstName,
        profile_last_name: userData.lastName,
        profile_job_title: userData.jobTitle,
        profile_school_name: userData.schoolName,
        profile_school_address: userData.schoolAddress,
      });
      
      if (error) throw error;
      
      return { error: null, success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error, success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        authCheckComplete,
        signIn,
        signUp,
        signOut,
        completeUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Use this Provider as the main Auth provider in your application
export default AuthContext;
