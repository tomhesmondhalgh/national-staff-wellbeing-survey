
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import BenefitsSection from '../components/upgrade/BenefitsSection';
import IntroSection from '../components/upgrade/IntroSection';
import PricingSection from '../components/upgrade/PricingSection';

const Upgrade = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Improving Staff Wellbeing Made Easy" 
          subtitle="Effective evidence-based strategies in an easy-to-use plan" 
          alignment="center" 
        />
        
        <BenefitsSection />
        <IntroSection />
        <PricingSection />
      </div>
    </MainLayout>
  );
};

export default Upgrade;
