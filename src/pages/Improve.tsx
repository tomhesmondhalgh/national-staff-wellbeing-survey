
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import IntroSection from '../components/improve/IntroSection';
import BenefitsSection from '../components/improve/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';

const Improve = () => {
  return (
    <MainLayout>
      <IntroSection />
      <BenefitsSection />
      <PricingSection />
    </MainLayout>
  );
};

export default Improve;
