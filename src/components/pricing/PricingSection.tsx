
import React, { useState } from 'react';
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans';
import PlanCard from './PlanCard';
import { useSubscription } from '../../hooks/useSubscription';
import { Plan } from '../../types/subscription';

interface PricingSectionProps {
  showFeatures?: boolean;
  showCta?: boolean;
  className?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  showFeatures = true,
  showCta = true,
  className = ''
}) => {
  const { plans, isLoading } = useSubscriptionPlans();
  const { subscription } = useSubscription();
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [currentPlanType, setCurrentPlanType] = useState<string | null>(null);

  React.useEffect(() => {
    if (plans && plans.length > 0) {
      // Sort plans by sort_order
      const sortedPlans = [...plans].sort((a, b) => a.sort_order - b.sort_order);
      setActivePlans(sortedPlans as Plan[]);
    }
  }, [plans]);

  React.useEffect(() => {
    if (subscription && subscription.plan) {
      setCurrentPlanType(subscription.plan.toLowerCase());
    }
  }, [subscription]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Loading Plans...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`container py-12 ${className}`}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
        <p className="text-xl text-muted-foreground">
          Select the plan that best suits your school's wellbeing journey
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlanType === plan.name.toLowerCase()}
            showFeatures={showFeatures}
            showCta={showCta}
          />
        ))}
      </div>
    </div>
  );
};

export default PricingSection;
