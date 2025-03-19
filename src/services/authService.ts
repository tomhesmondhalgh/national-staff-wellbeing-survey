
import { supabase } from '@/integrations/supabase/client';

// Simple cache for authentication
const authCache: {
  isAuthenticated: boolean;
  timestamp: number;
  expiresAt: number;
} = {
  isAuthenticated: false,
  timestamp: 0,
  expiresAt: 0
};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Check if a user is authenticated
 * Uses caching to minimize API requests
 */
export async function checkAuthentication(): Promise<boolean> {
  const now = Date.now();
  
  // Check cache first
  if (now < authCache.expiresAt) {
    return authCache.isAuthenticated;
  }
  
  // Cache miss or expired cache, fetch from Supabase
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
    
    const isAuthenticated = !!user;
    
    // Update cache
    authCache.isAuthenticated = isAuthenticated;
    authCache.timestamp = now;
    authCache.expiresAt = now + CACHE_EXPIRY;
    
    return isAuthenticated;
  } catch (error) {
    console.error('Error in authentication check:', error);
    return false;
  }
}

/**
 * Clear authentication cache
 */
export function clearAuthCache() {
  authCache.isAuthenticated = false;
  authCache.timestamp = 0;
  authCache.expiresAt = 0;
}

/**
 * Check if current user owns a record by its user_id field
 */
export async function isOwner(recordUserId: string): Promise<boolean> {
  if (!recordUserId) return false;
  
  try {
    // Use the is_owner function to check ownership
    const { data, error } = await supabase.rpc(
      'is_owner',
      {
        record_user_id: recordUserId
      }
    );
    
    if (error) {
      console.error('Error checking ownership:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Unexpected error checking ownership:', error);
    return false;
  }
}
