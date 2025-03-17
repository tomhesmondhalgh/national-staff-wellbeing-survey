
import React, { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import IntroSection from '../components/improve/IntroSection';
import BenefitsSection from '../components/improve/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';
import AccessBarrier from '../components/improve/AccessBarrier';
import { useSubscription } from '../hooks/useSubscription';

const Improve = () => {
  const { hasAccess, isLoading } = useSubscription();
  const [showBarrier, setShowBarrier] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        const hasFoundationAccess = await hasAccess('foundation');
        setShowBarrier(!hasFoundationAccess);
      }
    };
    
    checkAccess();
  }, [hasAccess, isLoading]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Wellbeing Action Plan</h1>
          <p className="text-gray-600">
            Track and improve staff wellbeing using this action planning tool
          </p>
        </div>
        
        {showBarrier ? (
          <AccessBarrier />
        ) : (
          <>
            <IntroSection />
            <BenefitsSection />
          </>
        )}
        
        {showBarrier && <PricingSection className="mt-8" />}
      </div>
    </MainLayout>
  );
};

export default Improve;
