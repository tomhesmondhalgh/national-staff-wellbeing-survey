
import React from 'react';
import BenefitItem from './BenefitItem';

const BenefitsSection: React.FC = () => {
  const benefits = [
    "Show Staff You Value Them",
    "Keep Your Best Staff",
    "Save Money on Recruitment"
  ];

  return (
    <div className="flex flex-col md:flex-row md:justify-center gap-4 md:gap-6 mt-6 mb-8">
      {benefits.map((benefit, index) => (
        <BenefitItem key={index} text={benefit} />
      ))}
    </div>
  );
};

export default BenefitsSection;
