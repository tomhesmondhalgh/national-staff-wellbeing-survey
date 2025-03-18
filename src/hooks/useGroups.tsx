
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserGroups } from '../lib/supabase/client';
import { Group } from '../lib/supabase/client';
import { UserRoleType } from '../lib/supabase/client';

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userGroups = await getUserGroups(user.id);
        setGroups(userGroups);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading groups'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  return { groups, isLoading, error };
};
