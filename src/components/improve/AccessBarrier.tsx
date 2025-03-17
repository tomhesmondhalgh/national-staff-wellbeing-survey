
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface AccessBarrierProps {
  title: string;
  description: string;
  upgradeButtonText?: string;
}

const AccessBarrier: React.FC<AccessBarrierProps> = ({
  title,
  description,
  upgradeButtonText = 'View Upgrade Options'
}) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-16">{description}</p>
        
        <div className="bg-gray-50 rounded-lg p-12 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-4">Upgrade to Access the Action Plan</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            The Wellbeing Action Plan is available with Foundation, Progress, and Premium plans.
            Upgrade today to access powerful tools for planning and tracking staff wellbeing
            improvements.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/upgrade')}
              className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white py-2 px-6 rounded-full"
            >
              {upgradeButtonText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessBarrier;
