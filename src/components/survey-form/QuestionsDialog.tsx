
import React from 'react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { CustomQuestion } from '../../types/customQuestions';
import QuestionsList from '../questions/QuestionsList';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

interface QuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customQuestions: CustomQuestion[];
  selectedQuestions: string[];
  onSelectQuestion: (questionId: string) => void;
  isLoadingQuestions: boolean;
}

const QuestionsDialog: React.FC<QuestionsDialogProps> = ({
  open,
  onOpenChange,
  customQuestions,
  selectedQuestions,
  onSelectQuestion,
  isLoadingQuestions,
}) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Questions</DialogTitle>
          <DialogDescription>
            Select questions to add to your survey.
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingQuestions ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading questions...</p>
          </div>
        ) : customQuestions.length > 0 ? (
          <QuestionsList
            questions={customQuestions}
            onUpdate={() => {}} // We'll handle updates in the parent component
            isSelectable
            selectedQuestions={selectedQuestions}
            onSelectQuestion={onSelectQuestion}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't created any custom questions yet.</p>
            <Button onClick={() => navigate('/questions')}>
              Create Questions
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionsDialog;
