
import React from 'react';
import SurveyIntro from './SurveyIntro';
import { SurveyTemplate } from '../../utils/types/survey';
import { Button } from '../ui/button';
import SubmitButton from './SubmitButton';
import { CustomQuestionType, SurveyFormData } from '../../types/surveyForm';
import StandardQuestions from './StandardQuestions';
import CustomQuestionsSection from './CustomQuestionsSection';

interface SurveyFormContainerProps {
  surveyTemplate: SurveyTemplate;
  formData: SurveyFormData;
  customQuestions: CustomQuestionType[];
  isSubmitting: boolean;
  isPreview: boolean;
  handleInputChange: (key: string, value: string) => void;
  handleCustomQuestionResponse: (questionId: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const SurveyFormContainer: React.FC<SurveyFormContainerProps> = ({
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
          
          {isPreview && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-700 text-sm font-medium">Preview Mode</p>
                <p className="text-yellow-600 text-sm mt-1">This is a preview of how your survey will appear to participants.</p>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.close()}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyFormContainer;
