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
    return ['/login', '/signup', '/email-confirmation'].includes(location.pathname);
  };

  // Check if this is a social login user that needs to complete onboarding
  const needsOnboarding = (user: User | null) => {
    if (!user) {
      console.log('No user found, cannot determine if onboarding is needed');
      return false;
    }
    
    // Check if this is a social login (has provider and it's not email)
    const isSocialLogin = user.app_metadata?.provider && 
                          user.app_metadata.provider !== 'email';
    
    // Check if they have already completed onboarding (has school_name in metadata)
    const hasCompletedProfile = user.user_metadata?.school_name;
    
    console.log('Social login check:', { 
      isSocialLogin, 
      provider: user.app_metadata?.provider,
      hasCompletedProfile,
      schoolName: user.user_metadata?.school_name
    });
    
    return isSocialLogin && !hasCompletedProfile;
  };

  // Check if this appears to be a new social login session
  const isNewSocialLogin = () => {
    const socialLoginFlag = sessionStorage.getItem('socialLoginRedirect');
    if (socialLoginFlag) {
      console.log('Found social login redirect flag in session storage');
      return true;
    }
    return false;
  };

  // Determine if the user should be redirected to onboarding
  const shouldRedirectToOnboarding = (user: User | null) => {
    // If we're already on the onboarding page, no need to redirect
    if (location.pathname === '/onboarding') {
      return false;
    }
    
    // If this is a social login that needs to complete profile OR
    // if our session flag indicates we just came from a social login flow
    const redirectNeeded = (needsOnboarding(user) || isNewSocialLogin());
    
    console.log('Redirect to onboarding decision:', {
      needsOnboarding: needsOnboarding(user),
      isNewSocialLogin: isNewSocialLogin(),
      finalDecision: redirectNeeded
    });
    
    return redirectNeeded;
  };

  useEffect(() => {
    console.log('useAuthState effect running, current path:', location.pathname);
    console.log('Session storage items:', {
      socialLoginRedirect: sessionStorage.getItem('socialLoginRedirect'),
      socialLoginSource: sessionStorage.getItem('socialLoginSource'),
      socialLoginPreviousPath: sessionStorage.getItem('socialLoginPreviousPath')
    });
    
    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } };

    // Get initial session
    const initializeAuthState = async () => {
      try {
        console.log('Initializing auth state...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Initial session retrieved:', session?.user?.id);
        console.log('User metadata:', session?.user?.user_metadata);
        console.log('App metadata:', session?.user?.app_metadata);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle redirection logic based on session, onboarding needs, and current path
        if (session?.user) {
          if (shouldRedirectToOnboarding(session.user)) {
            console.log('User needs onboarding, redirecting to onboarding page');
            setIsLoading(false);
            navigate('/onboarding');
            return;
          }
          
          // Only redirect from auth pages to dashboard if fully onboarded
          if (isAuthRelatedPage() && !needsOnboarding(session.user)) {
            console.log('User already onboarded, redirecting to dashboard from auth page');
            setIsLoading(false);
            navigate('/dashboard');
            return;
          }
        } else if (!isAuthRelatedPage() && location.pathname !== '/onboarding') {
          // If no user and not on auth page or onboarding, redirect to login
          console.log('No user detected and not on auth page, redirecting to login');
          setIsLoading(false);
          navigate('/login');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in auth state initialization:', error);
        setIsLoading(false);
      }
    };

    initializeAuthState();

    // Listen for auth changes
    authStateSubscription = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        console.log('User metadata:', session?.user?.user_metadata);
        console.log('App metadata:', session?.user?.app_metadata);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('SIGNED_IN event detected');
          
          if (shouldRedirectToOnboarding(session?.user)) {
            console.log('User needs onboarding after sign in, redirecting');
            navigate('/onboarding');
            return;
          }
          
          // Otherwise redirect from auth pages to dashboard if fully onboarded
          if (isAuthRelatedPage() && !needsOnboarding(session?.user)) {
            console.log('User signed in and onboarded, redirecting to dashboard');
            navigate('/dashboard');
            return;
          }
        } else if (event === 'SIGNED_OUT') {
          // Redirect to login page when signed out
          if (!isAuthRelatedPage()) {
            console.log('User signed out, redirecting to login');
            navigate('/login');
          }
        }
      }
    );

    return () => {
      console.log('Cleaning up auth subscription');
      authStateSubscription.data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { user, session, isLoading };
}
