
import React from 'react';
import { Check } from 'lucide-react';

const BenefitsSection: React.FC = () => {
  const benefits = [
    "Show Staff You Value Them",
    "Keep Your Best Staff",
    "Save Money on Recruitment"
  ];

  return (
    <div className="flex flex-col md:flex-row justify-center gap-8 mb-12">
      {benefits.map((benefit, index) => (
        <div key={index} className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
          <span className="text-gray-700 font-medium">{benefit}</span>
        </div>
      ))}
    </div>
  );
};

export default BenefitsSection;
