
import React from 'react';
import PageTitle from '../ui/PageTitle';
import { SurveyTemplate } from '../../utils/surveyUtils';
import NavbarBrand from '../layout/NavbarBrand';

interface SurveyIntroProps {
  surveyTemplate: SurveyTemplate | null;
}

const SurveyIntro: React.FC<SurveyIntroProps> = ({ surveyTemplate }) => {
  return (
    <>
      <div className="flex justify-center mb-6">
        <NavbarBrand />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-brandPurple-700">
        Staff Wellbeing Survey
      </h1>
      
      {surveyTemplate?.name && (
        <h2 className="text-xl text-center mb-6 text-gray-600">
          {surveyTemplate.name}
        </h2>
      )}
      
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
