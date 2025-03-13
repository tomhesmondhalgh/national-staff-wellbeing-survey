
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { IntroSection } from '../components/upgrade/IntroSection';
import { BenefitsSection } from '../components/upgrade/BenefitsSection';
import PricingSection from '../components/pricing/PricingSection';

const Upgrade = () => {
  return (
    <MainLayout>
      <IntroSection />
      <BenefitsSection />
      <PricingSection />
    </MainLayout>
  );
};

export default Upgrade;
