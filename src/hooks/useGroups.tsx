
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../lib/supabase/client';

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
        // Direct query instead of function call
        const { data, error: groupError } = await supabase
          .from('group_members')
          .select('group_id, groups(*)')
          .eq('user_id', user.id);
          
        if (groupError) {
          throw groupError;
        }
        
        const userGroups: Group[] = (data || []).map(item => ({
          id: item.group_id,
          name: item.groups?.name || 'Unknown',
          description: item.groups?.description,
          created_at: item.groups?.created_at || new Date().toISOString(),
          updated_at: item.groups?.updated_at || new Date().toISOString()
        }));
        
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
