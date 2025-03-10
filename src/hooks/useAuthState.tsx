
import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const profileCheckDone = useRef(false);

  // Add a ref to track if component is mounted
  const isMounted = useRef(true);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkProfileCompletion = async (user: User) => {
    // Skip if already checked or component unmounted
    if (profileCheckDone.current || !isMounted.current) return;
    profileCheckDone.current = true;

    try {
      console.log('Checking profile completion for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('school_name, job_title')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile data:', error);
        return;
      }
      
      console.log('Profile data:', data);
      
      if (data && (!data.school_name || !data.job_title)) {
        console.log('Profile incomplete, showing toast notification');
        if (isMounted.current) {
          toast({
            title: "Complete your profile",
            description: (
              <p>
                Complete your profile for better <a href="/profile" className="underline text-blue-600 hover:text-blue-800">future analysis</a>.
              </p>
            ),
            duration: 10000,
          });
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  useEffect(() => {
    console.log('useAuthState effect running');
    
    // Skip if component is unmounted
    if (!isMounted.current) return;
    
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Logged in' : 'Not logged in');
      
      // Skip if component is unmounted
      if (!isMounted.current) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated, check profile completion
      if (session?.user) {
        checkProfileCompletion(session.user);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      
      // Skip if component is unmounted
      if (!isMounted.current) return;
      
      setIsLoading(false);
    });

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          console.log('Auth state changed, event:', _event);
          
          // Skip if component is unmounted
          if (!isMounted.current) return;
          
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          // If user just signed in, check profile completion
          if (session?.user && _event === 'SIGNED_IN') {
            checkProfileCompletion(session.user);
          }
        }
      );

      authSubscription = subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      
      // Skip if component is unmounted
      if (!isMounted.current) return;
      
      setIsLoading(false);
    }

    return () => {
      console.log('Cleaning up auth subscription');
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return { user, session, isLoading };
}
