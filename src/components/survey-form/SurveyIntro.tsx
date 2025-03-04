
import React from 'react';
import PageTitle from '../ui/PageTitle';

interface SurveyIntroProps {
  name: string;
}

const SurveyIntro: React.FC<SurveyIntroProps> = ({ name }) => {
  return (
    <>
      <PageTitle 
        title={name || "Complete the National Staff Wellbeing Survey"}
      />
      
      <div className="mb-8 text-left">
        <p className="text-gray-700">
          Completing this survey will only take around 5 minutes, but it will give your school or college 
          crucial information that will help them improve the wellbeing of staff. You'll also be helping to 
          improve staff wellbeing on a national level. This is an anonymous survey, please do not include 
          any personal identifiable data.
        </p>
      </div>
    </>
  );
};

export default SurveyIntro;
