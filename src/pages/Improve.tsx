
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';

const Improve = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Improvement Strategies" 
          subtitle="Discover ways to improve wellbeing based on your survey results"
        />
        
        <div className="mt-8">
          {/* Content will be added later */}
        </div>
      </div>
    </MainLayout>
  );
};

export default Improve;
