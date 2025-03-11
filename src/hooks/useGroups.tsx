
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserGroups,
  Group,
  UserRoleType,
  supabase
} from '../lib/supabase/client';

export interface GroupWithRole extends Group {
  role: UserRoleType | null;
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Function to fetch groups and roles
  const fetchGroups = async () => {
    if (!user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Get all groups the user belongs to
      const fetchedGroups = await getUserGroups();
      
      // Get the user's role for each group
      const groupsWithRoles = await Promise.all(
        fetchedGroups.map(async (group) => {
          // Check if user is system admin
          const { data: adminRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'administrator')
            .maybeSingle();
            
          if (adminRole) return { ...group, role: 'administrator' as UserRoleType };
          
          // Get role from group_members
          const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', group.id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          return { 
            ...group, 
            role: membership ? (membership.role as UserRoleType) : null 
          };
        })
      );
      
      setGroups(groupsWithRoles);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch groups when the user changes
  useEffect(() => {
    fetchGroups();
  }, [user]);

  return {
    groups,
    isLoading,
    refreshGroups: fetchGroups
  };
}
