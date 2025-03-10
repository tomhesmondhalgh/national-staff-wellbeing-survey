
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useAdminRole } from './useAdminRole';
import { PlanType, SubscriptionAccess, getUserSubscription, checkPlanAccess } from '../lib/supabase/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isTestingMode, testingPlan } = useTestingMode();
  const { isAdmin } = useAdminRole();

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      try {
        const userSubscription = await getUserSubscription(user.id);
        setSubscription(userSubscription);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  // If in testing mode and admin, use the testing plan
  const effectiveSubscription = (isAdmin && isTestingMode && testingPlan) ? {
    plan: testingPlan,
    isActive: true
  } : subscription;

  const hasAccess = async (requiredPlan: PlanType): Promise<boolean> => {
    if (!user) return false;
    if (isAdmin && isTestingMode && testingPlan) {
      const planLevels = { free: 0, foundation: 1, progress: 2, premium: 3 };
      return planLevels[testingPlan] >= planLevels[requiredPlan];
    }
    return checkPlanAccess(user.id, requiredPlan);
  };

  return {
    subscription: effectiveSubscription,
    isLoading,
    hasAccess,
    isPremium: effectiveSubscription?.plan === 'premium' && effectiveSubscription?.isActive,
    isProgress: effectiveSubscription?.plan === 'progress' && effectiveSubscription?.isActive,
    isFoundation: effectiveSubscription?.plan === 'foundation' && effectiveSubscription?.isActive,
    isFree: effectiveSubscription?.plan === 'free' || !effectiveSubscription?.isActive,
  };
}
