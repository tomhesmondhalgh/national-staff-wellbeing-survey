import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';

// Define the Group interface to fix the error
export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

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
        
        // Debug the structure to better understand what we're working with
        if (data && data.length > 0) {
          console.log('Sample group item structure:', data[0]);
        }
        
        const userGroups: Group[] = (data || []).map(item => {
          // Get the group data from the groups property
          const groupData = item.groups || {};
          
          // Explicitly cast each property to the required type with fallbacks
          const name: string = 
            typeof groupData === 'object' && 'name' in groupData && typeof groupData.name === 'string' 
              ? groupData.name 
              : 'Unknown';
              
          const description: string | undefined = 
            typeof groupData === 'object' && 'description' in groupData && typeof groupData.description === 'string'
              ? groupData.description 
              : undefined;
              
          const created_at: string = 
            typeof groupData === 'object' && 'created_at' in groupData && typeof groupData.created_at === 'string'
              ? groupData.created_at 
              : new Date().toISOString();
              
          const updated_at: string | undefined = 
            typeof groupData === 'object' && 'updated_at' in groupData && typeof groupData.updated_at === 'string'
              ? groupData.updated_at 
              : undefined;
          
          // Return a properly typed Group object
          return {
            id: item.group_id,
            name,
            description,
            created_at,
            updated_at
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
