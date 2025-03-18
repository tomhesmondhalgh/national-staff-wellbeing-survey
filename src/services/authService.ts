
import { supabase } from '@/integrations/supabase/client';
import { UserRoleType } from '@/lib/supabase/client';

// In-memory cache for user role checks
const roleCache: Record<string, {
  roles: Record<string, boolean>,
  timestamp: number,
  expiresAt: number
}> = {};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Check if a user has a specific role
 * Uses caching to minimize API requests
 */
export async function checkUserRole(userId: string, role: UserRoleType): Promise<boolean> {
  if (!userId) return false;
  
  const now = Date.now();
  
  // Check cache first
  if (roleCache[userId] && 
      roleCache[userId].roles[role] !== undefined && 
      now < roleCache[userId].expiresAt) {
    return roleCache[userId].roles[role];
  }
  
  // Cache miss or expired cache, fetch from database
  try {
    // Check if role is 'administrator' which is stored in user_roles table
    if (role === 'administrator') {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'administrator')
        .maybeSingle();
        
      if (error) {
        console.error('Error checking administrator role:', error);
        return false;
      }
      
      const hasRole = !!data;
      
      // Initialize or update cache
      if (!roleCache[userId]) {
        roleCache[userId] = {
          roles: {},
          timestamp: now,
          expiresAt: now + CACHE_EXPIRY
        };
      }
      
      // Update role in cache
      roleCache[userId].roles[role] = hasRole;
      roleCache[userId].timestamp = now;
      roleCache[userId].expiresAt = now + CACHE_EXPIRY;
      
      return hasRole;
    } 
    // For other organizational roles, check appropriate tables
    else if (['organization_admin', 'group_admin', 'editor', 'viewer'].includes(role)) {
      // First try the user_has_organization_role function if available
      try {
        // Check if the user has the role through direct organization membership
        const { data: directMembership, error: membershipError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', userId)
          .eq('role', role)
          .maybeSingle();
          
        if (membershipError) {
          console.error('Error checking organization membership:', membershipError);
        } else if (directMembership) {
          // User has direct role, update cache and return true
          if (!roleCache[userId]) {
            roleCache[userId] = {
              roles: {},
              timestamp: now,
              expiresAt: now + CACHE_EXPIRY
            };
          }
          
          roleCache[userId].roles[role] = true;
          roleCache[userId].timestamp = now;
          roleCache[userId].expiresAt = now + CACHE_EXPIRY;
          return true;
        }
        
        // Check if user has the role through a group
        const { data: groupMembership, error: groupError } = await supabase
          .from('group_members')
          .select('role')
          .eq('user_id', userId)
          .eq('role', role)
          .maybeSingle();
          
        if (groupError) {
          console.error('Error checking group membership:', groupError);
        } else if (groupMembership) {
          // User has group role, update cache and return true
          if (!roleCache[userId]) {
            roleCache[userId] = {
              roles: {},
              timestamp: now,
              expiresAt: now + CACHE_EXPIRY
            };
          }
          
          roleCache[userId].roles[role] = true;
          roleCache[userId].timestamp = now;
          roleCache[userId].expiresAt = now + CACHE_EXPIRY;
          return true;
        }
        
        // Neither direct nor group role found
        if (!roleCache[userId]) {
          roleCache[userId] = {
            roles: {},
            timestamp: now,
            expiresAt: now + CACHE_EXPIRY
          };
        }
        
        roleCache[userId].roles[role] = false;
        roleCache[userId].timestamp = now;
        roleCache[userId].expiresAt = now + CACHE_EXPIRY;
        return false;
      } catch (error) {
        console.error('Error in role check:', error);
        return false;
      }
    }
    
    // Default fallback for unknown roles
    return false;
  } catch (error) {
    console.error('Unexpected error in role check:', error);
    return false;
  }
}

/**
 * Clear role cache for a specific user
 */
export function clearRoleCache(userId?: string) {
  if (userId) {
    delete roleCache[userId];
  } else {
    // Clear entire cache
    Object.keys(roleCache).forEach(key => delete roleCache[key]);
  }
}

/**
 * Get all roles for a user
 * This is a more expensive operation so use sparingly
 */
export async function getUserRoles(userId: string): Promise<UserRoleType[]> {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return data.map(r => r.role as UserRoleType);
  } catch (error) {
    console.error('Unexpected error fetching roles:', error);
    return [];
  }
}
