
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
    // For other organizational roles, try to use the RPC function
    else if (['organization_admin', 'group_admin', 'editor', 'viewer'].includes(role)) {
      // First try the organization_members table via RPC to avoid recursion
      try {
        const { data: orgRoleData, error: orgRoleError } = await supabase
          .rpc('check_user_has_role', { 
            user_uuid: userId,
            role_name: role
          });
      
        if (orgRoleError) {
          console.error('Error in RPC role check:', orgRoleError);
          // Continue to fallback method
        } else {
          const hasRole = !!orgRoleData;
          
          // Update cache
          if (!roleCache[userId]) {
            roleCache[userId] = {
              roles: {},
              timestamp: now,
              expiresAt: now + CACHE_EXPIRY
            };
          }
          
          roleCache[userId].roles[role] = hasRole;
          roleCache[userId].timestamp = now;
          roleCache[userId].expiresAt = now + CACHE_EXPIRY;
          
          return hasRole;
        }
      } catch (rpcError) {
        console.error('Exception in RPC role check:', rpcError);
        // Continue to fallback
      }
      
      // Fallback to simplified role check through user_roles if RPC fails
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();
        
      if (roleError) {
        console.error('Error in fallback role check:', roleError);
        return false;
      }
      
      const hasRole = !!roleData;
      
      // Update cache
      if (!roleCache[userId]) {
        roleCache[userId] = {
          roles: {},
          timestamp: now,
          expiresAt: now + CACHE_EXPIRY
        };
      }
      
      roleCache[userId].roles[role] = hasRole;
      roleCache[userId].timestamp = now;
      roleCache[userId].expiresAt = now + CACHE_EXPIRY;
      
      return hasRole;
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
