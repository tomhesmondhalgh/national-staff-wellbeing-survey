
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
    // Use the has_role_v2 function to check if user has the role
    const { data, error } = await supabase.rpc(
      'has_role_v2',
      {
        user_uuid: userId,
        required_role: role
      }
    );
    
    if (error) {
      console.error('Error checking role:', error);
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
  } catch (error) {
    console.error('Error in role check:', error);
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
    // Get user roles by joining with roles table
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return data
      .filter(item => item.roles && item.roles.name)
      .map(item => item.roles.name as UserRoleType);
  } catch (error) {
    console.error('Unexpected error fetching roles:', error);
    return [];
  }
}
