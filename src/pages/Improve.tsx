
import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import IntroSection from '../components/improve/IntroSection';
import BenefitsSection from '../components/improve/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';
import AccessBarrier from '../components/improve/AccessBarrier';
import { useSubscription } from '../hooks/useSubscription';

const Improve = () => {
  const { hasAccess, isLoading } = useSubscription();
  const [hasFoundationAccess, setHasFoundationAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        const access = await hasAccess('foundation');
        setHasFoundationAccess(access);
      }
    };

    checkAccess();
  }, [hasAccess, isLoading]);

  return (
    <MainLayout>
      {hasFoundationAccess === false ? (
        <AccessBarrier 
          title="Wellbeing Action Plan" 
          description="Track and improve staff wellbeing using this action planning tool" 
        />
      ) : (
        <>
          <IntroSection />
          <BenefitsSection />
          <PricingSection />
        </>
      )}
    </MainLayout>
  );
};

export default Improve;
