
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon } from 'lucide-react';

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlanProps {
  title: string;
  price: string | React.ReactNode;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  popular?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const PricingPlan: React.FC<PricingPlanProps> = ({
  title,
  price,
  description,
  features,
  buttonText,
  popular = false,
  onSelect,
  disabled = false
}) => {
  return (
    <Card className={`flex flex-col h-full ${popular ? 'border-brandPurple-500 shadow-lg' : ''}`}>
      {popular && (
        <div className="bg-brandPurple-500 text-white text-xs font-medium px-3 py-1 rounded-t-md text-center">
          RECOMMENDED
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="pt-1.5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <div className="text-3xl font-bold">{price}</div>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className={`mt-1 rounded-full p-1 ${feature.included ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {feature.included ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className={feature.included ? '' : 'text-gray-400'}>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${popular ? 'bg-brandPurple-600 hover:bg-brandPurple-700' : ''}`}
          onClick={onSelect}
          disabled={disabled}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingPlan;
