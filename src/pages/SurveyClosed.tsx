
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { AlertOctagon } from 'lucide-react';
import { Button } from '../components/ui/button';

const SurveyClosed = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="page-container max-w-3xl mx-auto px-4 py-8 bg-gradient-to-b from-white to-brandPurple-50">
        <PageTitle
          title="Survey Closed"
        />
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-center mb-6">
            <AlertOctagon className="h-20 w-20 text-amber-500" />
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
              variant="default"
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
