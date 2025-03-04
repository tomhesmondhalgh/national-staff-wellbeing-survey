
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
    return ['/login', '/signup'].includes(location.pathname);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated and on an auth-related page, redirect to dashboard
      // Don't redirect if they're on the onboarding page, as social logins will land there
      if (session?.user && isAuthRelatedPage() && location.pathname !== '/onboarding') {
        // Check if the user needs to complete onboarding
        const needsOnboarding = session.user.app_metadata?.provider && 
                               !session.user.user_metadata?.school_name;
        
        if (needsOnboarding) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // If user signs in and is on an auth-related page, determine where to redirect
        if (session?.user && isAuthRelatedPage()) {
          // For social logins, check if they need to complete onboarding
          const isSocialLogin = session.user.app_metadata?.provider && 
                               session.user.app_metadata.provider !== 'email';
          const hasCompletedProfile = session.user.user_metadata?.school_name;
          
          if (isSocialLogin && !hasCompletedProfile) {
            console.log('Social login detected, redirecting to onboarding');
            navigate('/onboarding');
          } else {
            console.log('User authenticated, redirecting to dashboard');
            navigate('/dashboard');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { user, session, isLoading };
}
