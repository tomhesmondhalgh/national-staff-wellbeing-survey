
import React from 'react';
import { Check } from 'lucide-react';

interface BenefitItemProps {
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ text }) => {
  return (
    <div className="flex items-center">
      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
};

export default BenefitItem;
