
import React from 'react';
import PageTitle from '../ui/PageTitle';
import { SurveyTemplate } from '../../utils/surveyUtils';

interface SurveyIntroProps {
  surveyTemplate: SurveyTemplate | null;
}

const SurveyIntro: React.FC<SurveyIntroProps> = ({ surveyTemplate }) => {
  return (
    <>
      <PageTitle 
        title={surveyTemplate?.name ? surveyTemplate.name : "Complete the National Staff Wellbeing Survey"}
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
