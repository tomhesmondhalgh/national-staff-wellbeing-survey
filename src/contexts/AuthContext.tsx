import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{
    error: Error | null;
    success: boolean;
    user?: User | null;
  }>;
  signOut: () => Promise<void>;
  signInWithSocialProvider: (provider: Provider) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  completeUserProfile: (userId: string, userData: any) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRelatedPage = () => {
    return ['/login', '/signup', '/onboarding'].includes(location.pathname);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated and on an auth-related page, redirect to dashboard
      if (session?.user && isAuthRelatedPage()) {
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // If user signs in and is on an auth-related page, redirect to dashboard
        if (session?.user && isAuthRelatedPage()) {
          navigate('/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Logged in successfully!');
      return { error: null, success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error, success: false };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // If userData is provided, it means we're completing the final signup step
      // Otherwise, we're just creating the initial auth account
      const options = userData ? {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          // Don't include school info in this initial signup
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

      // Return user data so we can use it for the second step
      return { error: null, success: true, user: data.user };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error, success: false };
    }
  };

  const completeUserProfile = async (userId: string, userData: any) => {
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

      // Important: Use service role to bypass RLS policies for initial profile creation
      // This is only used once during onboarding to create the initial profile
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

      // Send welcome email
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

      toast.success('Account setup completed successfully!', {
        description: 'Please check your email to confirm your account.'
      });
      
      return { error: null, success: true };
    } catch (error) {
      console.error('Error completing user profile:', error);
      return { error: error as Error, success: false };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const signInWithSocialProvider = async (provider: Provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      // No need for toast here as the user will be redirected to the provider's authentication page
      return { error: null, success: true };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      toast.error(`Failed to sign in with ${provider}`);
      return { error: error as Error, success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithSocialProvider,
        completeUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
