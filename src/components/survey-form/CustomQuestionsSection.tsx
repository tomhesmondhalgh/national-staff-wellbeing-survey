
import React, { useEffect } from 'react';
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
  useEffect(() => {
    // Enhanced debugging for CustomQuestionsSection with more details
    console.log('CustomQuestionsSection component mounted/updated');
    console.log('customQuestions prop received:', customQuestions);
    console.log('customQuestions prop type:', typeof customQuestions);
    console.log('customQuestions is array?', Array.isArray(customQuestions));
    
    if (!customQuestions) {
      console.error('customQuestions prop is undefined or null');
    } else if (customQuestions.length === 0) {
      console.warn('customQuestions array is empty - data flow issue or no questions linked to survey');
      console.log('Potential causes:');
      console.log('1. No records in survey_questions table for this survey');
      console.log('2. Records exist but join query is failing');
      console.log('3. Data transformation issue after query');
    } else {
      console.log('Number of custom questions:', customQuestions.length);
      customQuestions.forEach((q, i) => {
        console.log(`Question ${i+1} details:`, {
          id: q.id || 'MISSING ID',
          text: q.text || 'MISSING TEXT',
          type: q.type || 'MISSING TYPE',
          options: q.options ? `${q.options.length} options` : 'No options',
          optionsType: q.options ? typeof q.options : 'undefined'
        });
        
        if (q.options) {
          console.log(`Question ${i+1} options:`, q.options);
        }
      });
    }
    
    console.log('Current form data:', formData);
    console.log('Custom responses in form data:', formData?.custom_responses || {});
    console.log('');
  }, [customQuestions, formData]);

  // Debug render count
  console.log('CustomQuestionsSection rendering, questions count:', 
    customQuestions ? customQuestions.length : 'no questions');

  // Early return if no questions with better logging
  if (!customQuestions) {
    console.error('customQuestions prop is undefined or null - check data flow from parent component');
    return null;
  }
  
  if (customQuestions.length === 0) {
    console.log('CustomQuestionsSection: No custom questions available to render - check if questions are linked to this survey');
    return null;
  }

  console.log('Rendering CustomQuestionsSection with questions:', customQuestions);

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
            currentValue: formData?.custom_responses?.[question.id] || ''
          });
          
          const isMultipleChoice = 
            question.type === 'multiple_choice' && 
            question.options && 
            Array.isArray(question.options) && 
            question.options.length > 0;
          
          console.log(`Question ${question.id} is multiple choice?`, isMultipleChoice);
          
          if (isMultipleChoice) {
            return (
              <CustomMultipleChoiceQuestion
                key={question.id}
                label={question.text}
                name={`custom-${question.id}`}
                options={question.options || []}
                value={formData?.custom_responses?.[question.id] || ''}
                onChange={(e) => handleCustomQuestionResponse(question.id, e.target.value)}
              />
            );
          }
          
          return (
            <CustomTextQuestion
              key={question.id}
              label={question.text}
              name={`custom-${question.id}`}
              value={formData?.custom_responses?.[question.id] || ''}
              onChange={(e) => handleCustomQuestionResponse(question.id, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CustomQuestionsSection;
