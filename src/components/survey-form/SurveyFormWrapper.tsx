
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
    <SurveyFormContainer>
      <SurveyIntro name={surveyTemplate.name} />
      
      <SurveyFormContent
        formData={formData}
        surveyId={surveyId}
        isSubmitting={isSubmitting}
        handleInputChange={handleInputChange}
        handleCustomQuestionResponse={handleCustomQuestionResponse}
        handleSubmit={handleSubmit}
      />
      
      {isPreview && <PreviewModeFooter />}
    </SurveyFormContainer>
  );
};

export default SurveyFormWrapper;
