
import { supabase } from '@/integrations/supabase/client';
import { PlanType, SubscriptionAccess } from '@/lib/supabase/subscription';

// In-memory cache for subscription data
// This reduces the need for repeated API calls
const subscriptionCache: Record<string, {
  subscription: SubscriptionAccess | null,
  timestamp: number,
  expiresAt: number
}> = {};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Get user subscription data with caching
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionAccess | null> {
  if (!userId) return null;
  
  const now = Date.now();
  
  // Check cache first
  if (subscriptionCache[userId] && now < subscriptionCache[userId].expiresAt) {
    return subscriptionCache[userId].subscription;
  }
  
  // Cache miss or expired cache, fetch from database
  try {
    const { data, error } = await supabase
      .rpc('get_user_subscription', { user_uuid: userId });

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    const subscription = !data || data.length === 0 
      ? { plan: 'free' as PlanType, isActive: false } 
      : { 
          plan: data[0].plan as PlanType, 
          isActive: data[0].is_active 
        };
    
    // Update cache
    subscriptionCache[userId] = {
      subscription,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRY
    };
    
    return subscription;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Batch fetch subscriptions for multiple users
 * This is more efficient when needing data for multiple users at once
 */
export async function batchGetUserSubscriptions(userIds: string[]): Promise<Record<string, SubscriptionAccess | null>> {
  if (!userIds.length) return {};
  
  const now = Date.now();
  const result: Record<string, SubscriptionAccess | null> = {};
  const idsToFetch: string[] = [];
  
  // First check cache for each user ID
  userIds.forEach(userI => {
    if (subscriptionCache[userI] && now < subscriptionCache[userI].expiresAt) {
      result[userI] = subscriptionCache[userI].subscription;
    } else {
      idsToFetch.push(userI);
    }
  });
  
  // If all IDs were in cache, return immediately
  if (idsToFetch.length === 0) {
    return result;
  }
  
  // Fetch subscriptions for users not in cache
  try {
    // We'll need a custom RPC function to handle this efficiently
    // For now, we fetch them individually
    await Promise.all(idsToFetch.map(async (id) => {
      const sub = await getUserSubscription(id);
      result[id] = sub;
    }));
    
    return result;
  } catch (error) {
    console.error('Error in batchGetUserSubscriptions:', error);
    // Return what we have plus nulls for failures
    idsToFetch.forEach(id => {
      if (!result[id]) result[id] = null;
    });
    return result;
  }
}

/**
 * Check if user has access to a specific plan level with caching
 */
export async function checkPlanAccess(userId: string, requiredPlan: PlanType): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // Get cached subscription first if available
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;
    
    // Compare plan levels
    const planLevels: Record<PlanType, number> = {
      free: 0,
      foundation: 1,
      progress: 2,
      premium: 3
    };
    
    const userPlanLevel = subscription.isActive ? planLevels[subscription.plan] : 0;
    const requiredPlanLevel = planLevels[requiredPlan];
    
    return userPlanLevel >= requiredPlanLevel;
  } catch (error) {
    console.error('Error in checkPlanAccess:', error);
    return false;
  }
}

/**
 * Clear subscription cache for a specific user or all users
 */
export function clearSubscriptionCache(userId?: string) {
  if (userId) {
    delete subscriptionCache[userId];
  } else {
    // Clear entire cache
    Object.keys(subscriptionCache).forEach(key => delete subscriptionCache[key]);
  }
}

/**
 * Force refresh the subscription data for a user
 */
export async function refreshUserSubscription(userId: string): Promise<SubscriptionAccess | null> {
  if (userId) {
    // Remove from cache to force a refresh
    delete subscriptionCache[userId];
    // Fetch fresh data
    return getUserSubscription(userId);
  }
  return null;
}
