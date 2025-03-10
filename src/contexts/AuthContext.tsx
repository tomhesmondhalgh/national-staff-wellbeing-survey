
import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signOutUser, signInWithSocialProvider, completeUserProfile } from '../utils/authUtils';

// Define a custom Provider type that includes the values we need
type AuthProvider = 'google' | 'microsoft' | 'azure';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signOut: () => Promise<any>;
  socialSignIn: (provider: AuthProvider) => Promise<any>;
  completeProfile: (userId: string, userData: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isComponentMounted = useRef(true);

  // This effect runs once on component mount
  useEffect(() => {
    // Set mount flag
    isComponentMounted.current = true;
    
    async function getInitialSession() {
      try {
        const { data } = await supabase.auth.getSession();
        
        // Only update state if component is still mounted
        if (isComponentMounted.current) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isComponentMounted.current) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (isComponentMounted.current) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    });

    // Clean up subscription and set active flag to false
    return () => {
      isComponentMounted.current = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    return signInWithEmail(email, password);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    return signUpWithEmail(email, password, userData);
  };

  const signOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      navigate('/login');
    }
    return result;
  };

  const socialSignIn = async (provider: AuthProvider) => {
    return signInWithSocialProvider(provider);
  };

  const completeProfile = async (userId: string, userData: any) => {
    return completeUserProfile(userId, userData);
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    socialSignIn,
    completeProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
