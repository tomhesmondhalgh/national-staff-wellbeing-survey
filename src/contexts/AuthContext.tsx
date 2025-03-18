
import React, { createContext, useContext } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  signInWithSocialProvider,
  completeUserProfile
} from '../utils/authUtils';

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
  completeUserProfile: (userId: string, userData: any) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, session, isLoading } = useAuthState();

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
  };

  const handleCompleteUserProfile = async (userId: string, userData: any) => {
    return completeUserProfile(userId, userData);
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
