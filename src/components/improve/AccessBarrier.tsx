
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

const AccessBarrier: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-10 text-center my-8">
      <h2 className="text-2xl font-bold mb-4">Upgrade to Access the Action Plan</h2>
      <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
        The Wellbeing Action Plan is available with Foundation, Progress, and Premium plans.
        Upgrade today to access powerful tools for planning and tracking staff wellbeing
        improvements.
      </p>
      <Button asChild className="bg-purple-500 hover:bg-purple-600">
        <Link to="/upgrade" className="inline-flex items-center">
          View Upgrade Options <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};

export default AccessBarrier;
