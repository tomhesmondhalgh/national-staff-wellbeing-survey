
import { supabase } from '../lib/supabase';

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
 * Check if current user is the owner of a resource
 */
export async function isResourceOwner(resourceId: string): Promise<boolean> {
  try {
    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }
    
    // Query for the resource
    const { data, error: resourceError } = await supabase
      .from('survey_templates')
      .select('creator_id')
      .eq('id', resourceId)
      .single();
    
    if (resourceError || !data) {
      return false;
    }
    
    // Check if the user is the owner
    return data.creator_id === user.id;
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
}
