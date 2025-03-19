
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

export function useAdminRole() {
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
      // First check testing mode - this takes precedence over database role
      if (isTestingMode && testingRole) {
        const isAdminInTestMode = testingRole === 'administrator';
        setIsAdmin(isAdminInTestMode);
        setIsLoading(false);
        return;
      }
      
      // Check cache if not in testing mode
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
      
      // In the simplified model, we'll just check the user's metadata or email
      // for admin status. Use a simple check like domain or specific email list
      const isUserAdmin = false; // Default to false for most users
      
      // For example, you could check if the user's email has a specific domain:
      // const isUserAdmin = user.email && user.email.endsWith('@admin-domain.com'); 
      
      // Or check against a hardcoded list of admin emails
      // const adminEmails = ['admin1@example.com', 'admin2@example.com'];
      // const isUserAdmin = user.email && adminEmails.includes(user.email);
      
      setIsAdmin(isUserAdmin);
      
      // Update cache
      adminStatusCache[user.id] = {
        isAdmin: isUserAdmin,
        timestamp: now,
        expiresAt: now + CACHE_EXPIRY
      };
      
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
