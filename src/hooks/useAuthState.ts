import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRelatedPage = () => {
    // Include onboarding as an auth related page, but we want to keep the user there
    // if they've been redirected for social login
    return ['/login', '/signup'].includes(location.pathname);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated and on an auth-related page, redirect to dashboard
      // We don't want to redirect away from onboarding if they're there
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
        // We don't want to redirect away from onboarding if they're there
        if (session?.user && isAuthRelatedPage()) {
          navigate('/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { user, session, isLoading };
}
