
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import IntroSection from '../components/upgrade/IntroSection';
import BenefitsSection from '../components/upgrade/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';

const Upgrade = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
          <p className="text-gray-600">
            Access more features and support by upgrading to a higher plan
          </p>
        </div>
        
        <IntroSection />
        <BenefitsSection />
        <PricingSection />
      </div>
    </MainLayout>
  );
};

export default Upgrade;
