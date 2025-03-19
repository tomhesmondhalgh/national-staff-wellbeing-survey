
import React from 'react';
import { CustomQuestionType, SurveyFormData } from '../../types/surveyForm';
import StandardQuestions from './StandardQuestions';
import CustomQuestionsSection from './CustomQuestionsSection';
import SubmitButton from './SubmitButton';

interface SurveyFormContentProps {
  formData: SurveyFormData;
  customQuestions: CustomQuestionType[];
  isSubmitting: boolean;
  handleInputChange: (key: string, value: string) => void;
  handleCustomQuestionResponse: (questionId: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const SurveyFormContent: React.FC<SurveyFormContentProps> = ({
  formData,
  customQuestions,
  isSubmitting,
  handleInputChange,
  handleCustomQuestionResponse,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <StandardQuestions 
        formData={formData} 
        handleInputChange={handleInputChange} 
      />
      
      {customQuestions.length > 0 && (
        <CustomQuestionsSection 
          customQuestions={customQuestions}
          formData={formData}
          handleCustomQuestionResponse={handleCustomQuestionResponse}
        />
      )}
      
      <div className="pt-6">
        <SubmitButton isSubmitting={isSubmitting} />
      </div>
    </form>
  );
};

export default SurveyFormContent;
