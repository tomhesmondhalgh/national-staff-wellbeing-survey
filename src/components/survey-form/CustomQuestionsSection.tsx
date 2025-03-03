
import React from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomQuestion } from '../../types/customQuestions';

interface CustomQuestionsSectionProps {
  selectedQuestions: string[];
  customQuestions: CustomQuestion[];
  onSelectQuestion: (questionId: string) => void;
  onShowQuestionsDialog: () => void;
}

const CustomQuestionsSection: React.FC<CustomQuestionsSectionProps> = ({
  selectedQuestions,
  customQuestions,
  onSelectQuestion,
  onShowQuestionsDialog
}) => {
  const navigate = useNavigate();

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-lg font-semibold mb-4">Custom Questions</h3>
      <p className="text-gray-600 mb-4">
        Add your custom questions to this survey. These will appear at the end of the standard questions.
      </p>
      
      {selectedQuestions.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Questions:</h4>
          <div className="grid gap-2">
            {selectedQuestions.map(id => {
              const question = customQuestions.find(q => q.id === id);
              return question ? (
                <div key={id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div>
                    <p className="font-medium">{question.text}</p>
                    <p className="text-xs text-gray-500">
                      {question.type === 'text' ? 'Text Response' : 'Dropdown Selection'}
                    </p>
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSelectQuestion(id)}
                  >
                    Remove
                  </Button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      ) : (
        <p className="text-amber-600 text-sm mb-4">No custom questions selected.</p>
      )}
      
      <div className="flex space-x-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onShowQuestionsDialog}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Questions
        </Button>
        
        <Button
          type="button"
          variant="link"
          onClick={() => navigate('/questions')}
        >
          Manage Questions
        </Button>
      </div>
    </div>
  );
};

export default CustomQuestionsSection;
