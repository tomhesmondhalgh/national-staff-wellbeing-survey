import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { clearRoleCache } from '@/services/authService';
import { ensureCurrentUserHasOrgAdminRole } from '../utils/auth/ensureUserRoles';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error: any }>;
  updateUser: (attributes: any) => Promise<{ data: any; error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for changes on auth state (login, signout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Log in user
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Set the session and user
      setSession(data.session);
      setUser(data.user);
      
      // Ensure the user has the organization_admin role
      await ensureCurrentUserHasOrgAdminRole();
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up user
  const signUp = async (email: string, password: string, metadata?: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      setSession(data.session);
      setUser(data.user);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Log out user
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Clear the session and user
      setSession(null);
      setUser(null);
      clearRoleCache();
    } catch (error: any) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

   // Update user attributes
   const updateUser = async (attributes: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(attributes);
      if (error) {
        console.error("Error updating user:", error);
        return { data: null, error };
      }
      setUser(data.user);
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating user:", error);
      return { data: null, error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        login,
        logout,
        signUp,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
