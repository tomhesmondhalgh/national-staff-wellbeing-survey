
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { useLocation } from 'react-router-dom';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const location = useLocation();

  console.log('useAuthState hook initializing, current route:', location.pathname);

  useEffect(() => {
    console.log('useAuthState effect running');
    let mounted = true;
    
    // Add a timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isLoading && mounted) {
        console.warn('Auth initialization timed out after 5 seconds');
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    }, 5000);
    
    const handleAuthChange = (currentSession: Session | null) => {
      if (!mounted) return;
      
      console.log('Setting auth state with session:', currentSession ? 'exists' : 'null');
      console.log('Session user has email:', currentSession?.user?.email ? 'Yes' : 'No');
      
      if (currentSession) {
        console.log('Session expires at:', 
          currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'No expiry');
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      setAuthCheckComplete(true);
    };
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Getting initial session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setIsLoading(false);
            setAuthCheckComplete(true);
          }
          return;
        }
        
        console.log('Initial session retrieved:', data.session ? 'Logged in' : 'Not logged in');
        if (mounted) {
          handleAuthChange(data.session);
        }
      } catch (error) {
        console.error('Exception getting initial session:', error);
        if (mounted) {
          setIsLoading(false);
          setAuthCheckComplete(true);
        }
      }
    };
    
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed, event:', event);
      
      // For debugging
      if (event === 'SIGNED_IN') {
        console.log('Sign in event detected. Session will expire at:', 
          newSession?.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : 'unknown');
      } else if (event === 'SIGNED_OUT') {
        console.log('Sign out event detected at:', new Date().toISOString());
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed at:', new Date().toISOString(),
          'New expiry:', newSession?.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : 'unknown');
      }
      
      if (mounted) {
        handleAuthChange(newSession);
      }
    });

    // Clean up function
    return () => {
      console.log('Cleaning up auth subscription');
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Return loading state until auth check is complete
  return { 
    user, 
    session, 
    isLoading,
    isAuthenticated: !!user && !!session,
    authCheckComplete
  };
}
