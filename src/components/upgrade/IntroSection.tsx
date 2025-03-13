
import React from 'react';
import PageTitle from '../ui/PageTitle';

const IntroSection: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <PageTitle 
        title="Improving Staff Wellbeing Made Easy" 
        subtitle="Effective evidence-based strategies in an easy-to-use plan"
        alignment="center"
        className="mb-12"
      />
      
      <p className="text-lg leading-relaxed text-gray-700 mb-6">
        Now you know the challenges staff face in your organisation, and the areas they'd like to change, 
        how do you go about making that change happen? The Human Kind Award framework is a detailed set 
        of 59 strategies you can use in your organisation to improve staff wellbeing.
      </p>
      
      <p className="text-lg leading-relaxed text-gray-700 mb-8">
        Sign up for our Foundation package below to access the Human Kind Framework and action planning 
        tool online, or sign up for one of our more complete packages to access a huge range of support 
        alongside it - to help you meet your goals faster.
      </p>
    </div>
  );
};

export default IntroSection;
