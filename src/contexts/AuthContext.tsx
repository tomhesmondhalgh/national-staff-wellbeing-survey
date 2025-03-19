
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { clearRoleCache } from '@/services/authService';
import { ensureCurrentUserHasOrgAdminRole } from '../utils/auth/ensureUserRoles';
import { useAuthState } from '@/hooks/useAuthState';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authCheckComplete: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: any }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error: any; user?: User }>;
  updateUser: (attributes: any) => Promise<{ data: any; error: any }>;
  completeUserProfile: (userData: any) => Promise<{ success: boolean; error: any }>;
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
  const { user, session, isLoading: authStateIsLoading, isAuthenticated, authCheckComplete } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);
  
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

      // Ensure the user has the organization_admin role
      await ensureCurrentUserHasOrgAdminRole();
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for login to maintain compatibility
  const signIn = login;

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

      return { success: true, error: null, user: data.user };
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
      // Clear role cache
      clearRoleCache();
    } catch (error: any) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for logout to maintain compatibility
  const signOut = logout;

  // Update user attributes
  const updateUser = async (attributes: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(attributes);
      if (error) {
        console.error("Error updating user:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating user:", error);
      return { data: null, error };
    }
  };

  // Complete user profile - used during signup flow
  const completeUserProfile = async (userData: any) => {
    try {
      const { error } = await updateUser({
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Error completing user profile:", error);
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading: isLoading || authStateIsLoading,
        isAuthenticated,
        authCheckComplete,
        login,
        signIn,
        logout,
        signOut,
        signUp,
        updateUser,
        completeUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
