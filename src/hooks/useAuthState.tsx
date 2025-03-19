
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import { useLocation } from 'react-router-dom';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  console.log('useAuthState hook initializing, current route:', location.pathname);

  useEffect(() => {
    console.log('useAuthState effect running');
    
    // Add a timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth initialization timed out after 5 seconds');
        setIsLoading(false);
      }
    }, 5000);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Logged in' : 'Not logged in');
      console.log('Session user has email:', session?.user?.email ? 'Yes' : 'No');
      console.log('Session expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry');
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(error => {
      console.error('Error getting session:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Auth state changed, event:', event);
          console.log('New session user has email:', newSession?.user?.email ? 'Yes' : 'No');
          console.log('Auth event timestamp:', new Date().toISOString());
          
          // For debugging
          if (event === 'SIGNED_IN') {
            console.log('Sign in event detected. Session will expire at:', 
              newSession?.expires_at ? new Date(newSession.expires_at * 1000).toISOString() : 'unknown');
          }
          
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
        }
      );

      return () => {
        console.log('Cleaning up auth subscription');
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
      clearTimeout(timeoutId);
      return () => { clearTimeout(timeoutId); }; 
    }
  }, []);

  return { user, session, isLoading };
}
