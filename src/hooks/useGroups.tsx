
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
        
        const userGroups: Group[] = (data || []).map(item => {
          // Debug the structure to better understand what we're working with
          console.log('Group item structure:', item);
          
          // Ensure we handle the case where groups might be null or not in expected format
          const groupData = item.groups || {};
          
          return {
            id: item.group_id,
            name: typeof groupData === 'object' && 'name' in groupData ? groupData.name || 'Unknown' : 'Unknown',
            description: typeof groupData === 'object' && 'description' in groupData ? groupData.description : undefined,
            created_at: typeof groupData === 'object' && 'created_at' in groupData ? 
              groupData.created_at || new Date().toISOString() : new Date().toISOString(),
            updated_at: typeof groupData === 'object' && 'updated_at' in groupData ? 
              groupData.updated_at || new Date().toISOString() : new Date().toISOString()
          };
        });
        
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
