
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import QuestionsList from '../questions/QuestionsList';
import { getUserCustomQuestions } from '../../utils/customQuestionsUtils';
import { CustomQuestion } from '../../types/customQuestions';

interface SurveyQuestionsProps {
  selectedQuestions: string[];
  onQuestionsChange: (questions: string[]) => void;
}

const SurveyQuestions: React.FC<SurveyQuestionsProps> = ({ 
  selectedQuestions,
  onQuestionsChange
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  
  useEffect(() => {
    if (showDialog) {
      fetchQuestions();
    }
  }, [showDialog]);
  
  useEffect(() => {
    setLocalSelected(selectedQuestions);
  }, [selectedQuestions]);
  
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const data = await getUserCustomQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectQuestion = (questionId: string) => {
    setLocalSelected(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };
  
  const handleSave = () => {
    onQuestionsChange(localSelected);
    setShowDialog(false);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Custom Questions</h3>
        <Button 
          variant="outline" 
          onClick={() => setShowDialog(true)}
        >
          Add Custom Questions
        </Button>
      </div>
      
      {selectedQuestions.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Questions:</h4>
          <ul className="space-y-2">
            {questions
              .filter(q => selectedQuestions.includes(q.id))
              .map(question => (
                <li key={question.id} className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{question.text}</span>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          No custom questions selected.
        </div>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Custom Questions</DialogTitle>
            <DialogDescription>
              Choose custom questions to include in your survey.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading questions...</p>
            </div>
          ) : (
            <>
              <div className="max-h-[400px] overflow-y-auto">
                <QuestionsList 
                  questions={questions}
                  onUpdate={() => {}}
                  isSelectable={true}
                  selectedQuestions={localSelected}
                  onSelectQuestion={handleSelectQuestion}
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Add Selected Questions
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurveyQuestions;
