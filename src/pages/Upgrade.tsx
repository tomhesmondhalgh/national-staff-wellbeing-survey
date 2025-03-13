
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import IntroSection from '../components/upgrade/IntroSection';
import BenefitsSection from '../components/upgrade/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';

const Upgrade = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <IntroSection />
        <BenefitsSection />
        <PricingSection />
      </div>
    </MainLayout>
  );
};

export default Upgrade;
