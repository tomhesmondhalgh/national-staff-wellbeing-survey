
import React from 'react';
import { useTestingMode } from '@/contexts/TestingModeContext';

const TestingModeIndicator = () => {
  const { isTestingMode, testingPlan, testingRole, disableTestingMode } = useTestingMode();

  if (!isTestingMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border border-yellow-300 shadow-lg rounded-lg p-3 max-w-xs">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-yellow-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-yellow-800">Testing Mode Active</p>
          <div className="mt-1 text-xs text-yellow-700 space-y-0.5">
            {testingPlan && <p>Plan: <span className="font-medium capitalize">{testingPlan}</span></p>}
            {testingRole && <p>Role: <span className="font-medium capitalize">{testingRole.replace('_', ' ')}</span></p>}
          </div>
          <button 
            onClick={disableTestingMode}
            className="mt-1 text-xs text-yellow-800 hover:text-yellow-900 underline"
          >
            Exit Testing Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingModeIndicator;
