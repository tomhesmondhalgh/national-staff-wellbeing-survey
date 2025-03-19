
import React from 'react';
import { SurveyTemplate } from '../../utils/types/survey';
import { SurveyFormData } from '../../types/surveyForm';
import SurveyFormContainer from './SurveyFormContainer';
import SurveyIntro from './SurveyIntro';
import SurveyFormContent from './SurveyFormContent';
import PreviewModeFooter from './PreviewModeFooter';

interface SurveyFormWrapperProps {
  surveyTemplate: SurveyTemplate;
  formData: SurveyFormData;
  surveyId: string | null;
  isSubmitting: boolean;
  isPreview: boolean;
  handleInputChange: (key: string, value: string) => void;
  handleCustomQuestionResponse: (questionId: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const SurveyFormWrapper: React.FC<SurveyFormWrapperProps> = ({
  surveyTemplate,
  formData,
  surveyId,
  isSubmitting,
  isPreview,
  handleInputChange,
  handleCustomQuestionResponse,
  handleSubmit
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8 border border-purple-100">
          <div className="mb-8 text-center">
            <img 
              src="/lovable-uploads/895356bb-776b-4070-8a89-a6e33e70cee6.png" 
              alt="Our Human Kind Logo" 
              className="mx-auto max-h-20 mb-4"
            />
            <h1 className="text-2xl font-bold text-brandPurple-600 mb-2">Staff Wellbeing Survey</h1>
            <h2 className="text-lg text-gray-600">{surveyTemplate.name}</h2>
          </div>
          
          <div className="mb-8 text-left">
            <p className="text-gray-700">
              Completing this survey will only take around 5 minutes, but it will give your school or college 
              crucial information that will help them improve the wellbeing of staff. You'll also be helping to 
              improve staff wellbeing on a national level. This is an anonymous survey, please do not include 
              any personal identifiable data.
            </p>
          </div>
          
          <SurveyFormContent
            formData={formData}
            surveyId={surveyId}
            isSubmitting={isSubmitting}
            handleInputChange={handleInputChange}
            handleCustomQuestionResponse={handleCustomQuestionResponse}
            handleSubmit={handleSubmit}
          />
          
          {isPreview && <PreviewModeFooter />}
        </div>
      </div>
    </div>
  );
};

export default SurveyFormWrapper;
