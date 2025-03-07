
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';

const Improve = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Improve" 
          subtitle="Resources to help improve wellbeing" 
          alignment="center" 
        />
        
        {/* Content will go here */}
      </div>
    </MainLayout>
  );
};

export default Improve;
