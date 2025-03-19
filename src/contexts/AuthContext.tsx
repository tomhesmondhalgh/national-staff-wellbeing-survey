
import React, { createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  completeUserProfile
} from '../utils/auth';
import { toast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authCheckComplete: boolean;  // Added this property
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
  completeUserProfile: (userId: string, userData: any) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, isLoading, isAuthenticated, authCheckComplete } = useAuthState();

  console.log('AuthProvider rendering with auth state:', 
    isAuthenticated ? 'authenticated' : 'not authenticated',
    'loading:', isLoading,
    'check complete:', authCheckComplete);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('Attempting to sign in user:', email);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        console.log('Sign in successful');
      } else {
        console.error('Sign in failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Exception during sign in:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during sign in',
        variant: 'destructive',
      });
      return { error: error as Error, success: false };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    console.log('Attempting to sign up user:', email);
    return signUpWithEmail(email, password, userData);
  }, []);

  const signOut = useCallback(async () => {
    console.log('Signing out user');
    try {
      const result = await signOutUser();
      if (result.success) {
        console.log('Sign out successful, redirecting to login');
        navigate('/login');
      } else {
        console.error('Sign out failed:', result.error);
        // Attempt to redirect anyway
        navigate('/login');
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
      // Attempt to redirect anyway
      navigate('/login');
    }
  }, [navigate]);

  const handleCompleteUserProfile = useCallback(async (userId: string, userData: any) => {
    return completeUserProfile(userId, userData);
  }, []);

  // If we're on a protected route and not loading, check authentication
  React.useEffect(() => {
    if (!isLoading && authCheckComplete && !isAuthenticated) {
      const isProtectedRoute = !['/login', '/signup', '/reset-password', '/email-confirmation', '/'].includes(location.pathname);
      
      if (isProtectedRoute) {
        console.log('User not authenticated on protected route, redirecting to login');
        const returnTo = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?returnTo=${returnTo}`);
      }
    }
  }, [isLoading, isAuthenticated, authCheckComplete, location.pathname, location.search, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        authCheckComplete, // Added this property to the context value
        signIn,
        signUp,
        signOut,
        completeUserProfile: handleCompleteUserProfile,
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
