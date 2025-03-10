
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlanType, SubscriptionAccess, getUserSubscription, checkPlanAccess } from '../lib/supabase/subscription';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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

  const hasAccess = async (requiredPlan: PlanType): Promise<boolean> => {
    if (!user) return false;
    return checkPlanAccess(user.id, requiredPlan);
  };

  return {
    subscription,
    isLoading,
    hasAccess,
    isPremium: subscription?.plan === 'premium' && subscription?.isActive,
    isProgress: subscription?.plan === 'progress' && subscription?.isActive,
    isFoundation: subscription?.plan === 'foundation' && subscription?.isActive,
    isFree: subscription?.plan === 'free' || !subscription?.isActive,
  };
}
