
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Link } from 'react-router-dom';

const SurveyComplete = () => {
  return (
    <MainLayout>
      <div className="page-container">
        <div className="max-w-3xl mx-auto text-center">
          <PageTitle
            title="Thank You for Completing the Survey!"
          />
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-20 w-20 text-green-500 mx-auto mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your response has been recorded
            </h2>
            
            <p className="text-gray-600 mb-8">
              Your feedback will help improve staff wellbeing at your organization and contribute to national insights on education staff wellbeing.
            </p>
            
            <Link to="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-8">
            The National Staff Wellbeing Survey is committed to improving working conditions for education professionals across the country.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyComplete;
