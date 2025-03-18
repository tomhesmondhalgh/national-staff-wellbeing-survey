
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { supabase } from '@/integrations/supabase/client';

// Create a simple in-memory cache to store admin status
// This is shared across all instances of the hook
const adminStatusCache: Record<string, {
  isAdmin: boolean,
  timestamp: number,
  expiresAt: number
}> = {};

// Cache expiry time in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export function useAdminRoleOptimized() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isTestingMode, testingRole } = useTestingMode();

  // Clear cache for a specific user
  const clearCache = useCallback((userId: string) => {
    if (adminStatusCache[userId]) {
      delete adminStatusCache[userId];
    }
  }, []);

  // Function to check if user has admin role with caching
  const checkAdminRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      // First handle testing mode case - this doesn't require API calls
      if (isTestingMode && testingRole) {
        const isAdminInTestMode = testingRole === 'administrator';
        setIsAdmin(isAdminInTestMode);
        setIsLoading(false);
        return;
      }
      
      // Check cache first
      const now = Date.now();
      const cachedData = adminStatusCache[user.id];
      
      if (cachedData && now < cachedData.expiresAt) {
        console.log('Using cached admin status for user:', user.id);
        setIsAdmin(cachedData.isAdmin);
        setIsLoading(false);
        return;
      }

      console.log('Fetching fresh admin status for user:', user.id);
      setIsLoading(true);
      
      // No valid cache, perform API call
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'administrator')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        const isRealAdmin = !!data;
        setIsAdmin(isRealAdmin);
        
        // Update cache
        adminStatusCache[user.id] = {
          isAdmin: isRealAdmin,
          timestamp: now,
          expiresAt: now + CACHE_EXPIRY
        };
      }
    } catch (error) {
      console.error('Error in admin role check:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, isTestingMode, testingRole]);

  useEffect(() => {
    checkAdminRole();
    
    // Set up a listener for auth state changes that might affect admin status
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      if (user) {
        // Clear cache when auth state changes
        clearCache(user.id);
        checkAdminRole();
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [user, isTestingMode, testingRole, checkAdminRole, clearCache]);

  // Expose method to force refresh the admin status
  const refreshAdminStatus = useCallback(() => {
    if (user) {
      clearCache(user.id);
      checkAdminRole();
    }
  }, [user, clearCache, checkAdminRole]);

  return { 
    isAdmin, 
    isLoading,
    refreshAdminStatus
  };
}
