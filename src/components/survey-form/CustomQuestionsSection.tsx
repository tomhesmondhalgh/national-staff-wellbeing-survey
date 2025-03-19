
import React from 'react';
import { CustomQuestionType, SurveyFormData } from '../../types/surveyForm';
import CustomTextQuestion from './CustomTextQuestion';
import CustomMultipleChoiceQuestion from './CustomMultipleChoiceQuestion';

interface CustomQuestionsSectionProps {
  customQuestions: CustomQuestionType[];
  formData: SurveyFormData;
  handleCustomQuestionResponse: (questionId: string, value: string) => void;
}

const CustomQuestionsSection: React.FC<CustomQuestionsSectionProps> = ({
  customQuestions,
  formData,
  handleCustomQuestionResponse
}) => {
  // Early return if no questions with better logging
  if (!customQuestions || customQuestions.length === 0) {
    console.log('No custom questions available to render');
    return null;
  }

  console.log('Rendering CustomQuestionsSection with questions:', customQuestions);
  console.log('Current form data for custom responses:', formData.custom_responses);

  return (
    <div className="mt-12 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-medium mb-6">Additional Questions</h3>
      <div className="space-y-8">
        {customQuestions.map((question) => {
          if (!question || !question.id) {
            console.error('Invalid question object:', question);
            return null;
          }
          
          console.log(`Rendering question ${question.id}: ${question.text} (type: ${question.type})`, { 
            options: question.options,
            currentValue: formData.custom_responses[question.id] || ''
          });
          
          const isMultipleChoice = 
            question.type === 'multiple_choice' && 
            question.options && 
            Array.isArray(question.options) && 
            question.options.length > 0;
          
          if (isMultipleChoice) {
            return (
              <CustomMultipleChoiceQuestion
                key={question.id}
                label={question.text}
                name={`custom-${question.id}`}
                options={question.options || []}
                value={formData.custom_responses[question.id] || ''}
                onChange={(e) => handleCustomQuestionResponse(question.id, e.target.value)}
              />
            );
          }
          
          return (
            <CustomTextQuestion
              key={question.id}
              label={question.text}
              name={`custom-${question.id}`}
              value={formData.custom_responses[question.id] || ''}
              onChange={(e) => handleCustomQuestionResponse(question.id, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CustomQuestionsSection;
