
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

  // Check if this is a social login user that needs to complete onboarding
  const needsOnboarding = (user: User | null) => {
    if (!user) return false;
    
    // Check if this is a social login (has provider and it's not email)
    const isSocialLogin = user.app_metadata?.provider && 
                          user.app_metadata.provider !== 'email';
    
    // Check if they have already completed onboarding (has school_name in metadata)
    const hasCompletedProfile = user.user_metadata?.school_name;
    
    return isSocialLogin && !hasCompletedProfile;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated and on an auth-related page, determine where to redirect
      if (session?.user) {
        console.log("Session user detected:", session.user.id);
        console.log("Current path:", location.pathname);
        console.log("User metadata:", session.user.user_metadata);
        console.log("App metadata:", session.user.app_metadata);
        
        // Don't redirect if already on the onboarding page
        if (location.pathname === '/onboarding') {
          console.log("Already on onboarding page, no redirect needed");
          return;
        }
        
        // Check if user needs to complete onboarding
        if (needsOnboarding(session.user)) {
          console.log("User needs onboarding, redirecting to onboarding page");
          navigate('/onboarding');
        } 
        // Only redirect from auth pages to dashboard
        else if (isAuthRelatedPage()) {
          console.log("User already onboarded, redirecting to dashboard");
          navigate('/dashboard');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        console.log('User metadata:', session?.user?.user_metadata);
        console.log('App metadata:', session?.user?.app_metadata);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (!session?.user) return;
        
        // Handle different events
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Don't redirect if already on the onboarding page
          if (location.pathname === '/onboarding') {
            console.log("Already on onboarding page, no redirect needed");
            return;
          }
          
          // Determine where to redirect the authenticated user
          if (needsOnboarding(session.user)) {
            console.log('Social login detected, redirecting to onboarding');
            navigate('/onboarding');
          } else if (isAuthRelatedPage()) {
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
