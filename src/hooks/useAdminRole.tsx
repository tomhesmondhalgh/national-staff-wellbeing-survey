
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { supabase, isUserAdmin } from '../lib/supabase/client';

// Simple cache for admin status
const adminCache: Record<string, {
  isAdmin: boolean;
  timestamp: number;
}> = {};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export function useAdminRole() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isTestingMode, testingRole } = useTestingMode();
  
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First check testing mode (this takes precedence)
      if (isTestingMode && testingRole === 'administrator') {
        console.log('Using testing mode admin status');
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }
      
      // Check cache
      const now = Date.now();
      if (adminCache[user.id] && (now - adminCache[user.id].timestamp) < CACHE_EXPIRY) {
        console.log('Using cached admin status');
        setIsAdmin(adminCache[user.id].isAdmin);
        setIsLoading(false);
        return;
      }
      
      // Not in cache or expired, check from database
      console.log('Checking admin status from database for:', user.email);
      const adminStatus = await isUserAdmin(user.id);
      
      // Update cache
      adminCache[user.id] = {
        isAdmin: adminStatus,
        timestamp: now
      };
      
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, isTestingMode, testingRole]);
  
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);
  
  const refreshAdminStatus = useCallback(() => {
    // Clear cache for this user
    if (user) {
      delete adminCache[user.id];
    }
    checkAdminStatus();
  }, [user, checkAdminStatus]);
  
  return {
    isAdmin,
    isLoading,
    refreshAdminStatus
  };
}
