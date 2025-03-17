
import { useState, useEffect } from 'react';
import { Plan, getPlans } from '../lib/supabase/subscription';

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoading(true);
        const plansData = await getPlans();
        setPlans(plansData);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch plans'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // Helper functions
  const getFreePlan = () => plans.find(plan => plan.price === 0 && plan.is_active);
  const getFoundationPlan = () => plans.find(plan => plan.name.toLowerCase() === 'foundation' && plan.is_active);
  const getProgressPlan = () => plans.find(plan => plan.name.toLowerCase() === 'progress' && plan.is_active);
  const getPremiumPlan = () => plans.find(plan => plan.name.toLowerCase() === 'premium' && plan.is_active);
  const getPopularPlan = () => plans.find(plan => plan.is_popular && plan.is_active);
  
  // Format price for display (convert from pence to pounds)
  const formatPrice = (price: number): string => {
    return `£${(price / 100).toFixed(0)}`;
  };

  return {
    plans,
    isLoading,
    error,
    getFreePlan,
    getFoundationPlan,
    getProgressPlan,
    getPremiumPlan,
    getPopularPlan,
    formatPrice
  };
}
