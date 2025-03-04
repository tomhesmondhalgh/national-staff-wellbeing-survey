
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRelatedPage = () => {
    return ['/login', '/signup', '/onboarding'].includes(location.pathname);
  };

  const checkProfileCompletion = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('school_name, job_title')
        .eq('id', user.id)
        .single();
      
      if (!error && data && (!data.school_name || !data.job_title)) {
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is authenticated, check profile completion
      if (session?.user && !isAuthRelatedPage()) {
        checkProfileCompletion(session.user);
      }
      
      // If user is authenticated and on an auth-related page, redirect to dashboard
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
        if (session?.user && isAuthRelatedPage()) {
          navigate('/dashboard');
        }
        
        // If user just signed in and not on auth page, check profile completion
        if (session?.user && !isAuthRelatedPage()) {
          checkProfileCompletion(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { user, session, isLoading };
}
