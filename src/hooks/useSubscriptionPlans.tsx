
import { useQuery } from '@tanstack/react-query';
import { Plan, getPlans } from '../lib/supabase/subscription';

export function useSubscriptionPlans() {
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const getFreePlan = () => plans?.find(plan => plan.price === 0) || null;
  
  const getPaidPlans = () => plans?.filter(plan => plan.price > 0) || [];
  
  const getPlanByType = (type: string) => 
    plans?.find(plan => plan.name.toLowerCase() === type.toLowerCase()) || null;
  
  const getPlanByStripeId = (stripeId: string) => 
    plans?.find(plan => plan.stripe_price_id === stripeId) || null;

  const getPopularPlan = () => plans?.find(plan => plan.is_popular) || null;

  return {
    plans: plans || [],
    isLoading,
    error,
    getFreePlan,
    getPaidPlans,
    getPlanByType,
    getPlanByStripeId,
    getPopularPlan
  };
}
