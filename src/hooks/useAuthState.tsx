
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  console.log('Current route:', location.pathname);

  const checkProfileCompletion = async (user: User) => {
    try {
      console.log('Checking profile completion for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('school_name, job_title')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile data:', error);
        return;
      }
      
      console.log('Profile data:', data);
      
      if (data && (!data.school_name || !data.job_title)) {
        console.log('Profile incomplete, showing toast notification');
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
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  useEffect(() => {
    console.log('useAuthState effect running');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Logged in' : 'Not logged in');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated, check profile completion
      if (session?.user) {
        checkProfileCompletion(session.user);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          console.log('Auth state changed, event:', _event);
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          
          // If user just signed in, check profile completion
          if (session?.user) {
            checkProfileCompletion(session.user);
          }
        }
      );

      return () => {
        console.log('Cleaning up auth subscription');
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  return { user, session, isLoading };
}
