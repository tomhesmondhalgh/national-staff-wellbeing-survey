
import React, { useEffect, useState } from 'react';
import MainLayout from '../layout/MainLayout';
import PageTitle from '../ui/PageTitle';

const SurveyLoading: React.FC = () => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Track loading time and show troubleshooting after 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 10 && !showTroubleshooting) {
          setShowTroubleshooting(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MainLayout>
      <div className="page-container max-w-4xl mx-auto px-4 py-8">
        <PageTitle 
          title="Loading Survey..." 
        />
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey data... ({loadingTime}s)</p>
          
          {showTroubleshooting && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800">Taking longer than expected?</h3>
              <p className="mt-2 text-sm text-yellow-700">
                There might be an issue with the connection to our servers. You can try:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                <li>Refreshing the page</li>
                <li>Checking your internet connection</li>
                <li>Trying again in a few minutes</li>
              </ul>
              <button 
                className="mt-4 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyLoading;
