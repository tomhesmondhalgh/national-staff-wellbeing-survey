
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import PageTitle from '../ui/PageTitle';

const SurveyNotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="page-container max-w-4xl mx-auto px-4 py-8">
        <PageTitle 
          title="Survey Not Found" 
        />
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-700 mb-6">
            The survey you are looking for could not be found or has expired.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyNotFound;
