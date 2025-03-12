
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { AlertTriangle } from 'lucide-react';

const SurveyClosed = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <PageTitle
          title="Survey Closed"
        />
        
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-8 text-center">
          <div className="h-20 w-20 text-amber-500 mx-auto mb-6">
            <AlertTriangle className="w-full h-full" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            This survey is no longer accepting responses
          </h2>
          
          <p className="text-gray-600 mb-8 text-center">
            The survey period has ended. Thank you for your interest.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-brandPurple-500 hover:bg-brandPurple-600"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyClosed;
