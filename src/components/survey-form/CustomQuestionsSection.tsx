
import React from 'react';
import { CustomQuestionType } from '../../types/surveyForm';
import CustomTextQuestion from './CustomTextQuestion';
import CustomMultipleChoiceQuestion from './CustomMultipleChoiceQuestion';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

interface CustomQuestionsSectionProps {
  questions: CustomQuestionType[];
  responses: Record<string, string>;
  onResponse: (questionId: string, value: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const CustomQuestionsSection: React.FC<CustomQuestionsSectionProps> = ({
  questions,
  responses,
  onResponse,
  isLoading = false,
  error = null
}) => {
  if (isLoading) {
    return (
      <div className="mt-12 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-6">Additional Questions</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-6">Additional Questions</h3>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem loading the additional questions: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Don't render anything if no questions
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    console.log('No questions to display in CustomQuestionsSection');
    return null;
  }

  console.log('Rendering questions in CustomQuestionsSection:', questions);

  return (
    <div className="mt-12 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-medium mb-6">Additional Questions</h3>
      <div className="space-y-8">
        {questions.map((question) => {
          if (!question || !question.id) {
            console.error('Invalid question object:', question);
            return null;
          }
          
          const currentValue = responses[question.id] || '';
          
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
                value={currentValue}
                onChange={(e) => onResponse(question.id, e.target.value)}
              />
            );
          }
          
          return (
            <CustomTextQuestion
              key={question.id}
              label={question.text}
              name={`custom-${question.id}`}
              value={currentValue}
              onChange={(e) => onResponse(question.id, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CustomQuestionsSection;
