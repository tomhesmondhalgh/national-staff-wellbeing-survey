
import React from 'react';
import { SurveyTemplate } from '../../utils/types/survey';
import { CustomQuestionType, SurveyFormData } from '../../types/surveyForm';
import SurveyIntro from './SurveyIntro';
import PreviewModeFooter from './PreviewModeFooter';
import SurveyFormContent from './SurveyFormContent';

interface SurveyFormWrapperProps {
  surveyTemplate: SurveyTemplate;
  formData: SurveyFormData;
  customQuestions: CustomQuestionType[];
  isSubmitting: boolean;
  isPreview: boolean;
  handleInputChange: (key: string, value: string) => void;
  handleCustomQuestionResponse: (questionId: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const SurveyFormWrapper: React.FC<SurveyFormWrapperProps> = ({
  surveyTemplate,
  formData,
  customQuestions,
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
          <SurveyIntro surveyTemplate={surveyTemplate} />
          
          <SurveyFormContent
            formData={formData}
            customQuestions={customQuestions}
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
