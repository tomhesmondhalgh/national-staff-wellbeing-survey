
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, MessageSquare, ListFilter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import { CustomQuestion } from '../../types/customQuestions';
import QuestionForm from './QuestionForm';
import { deleteCustomQuestion } from '../../utils/customQuestionsUtils';

interface QuestionsListProps {
  questions: CustomQuestion[];
  onUpdate: () => void;
  isSelectable?: boolean;
  selectedQuestions?: string[];
  onSelectQuestion?: (questionId: string) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ 
  questions, 
  onUpdate,
  isSelectable = false,
  selectedQuestions = [],
  onSelectQuestion
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<CustomQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);

  const handleDeleteClick = (question: CustomQuestion) => {
    setDeletingQuestion(question);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestion) return;
    
    try {
      const success = await deleteCustomQuestion(deletingQuestion.id);
      
      if (success) {
        toast.success("Question deleted successfully");
        onUpdate();
      } else {
        toast.error("Failed to delete question");
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setShowDeleteDialog(false);
      setDeletingQuestion(null);
    }
  };

  const handleEdit = (question: CustomQuestion) => {
    setEditingQuestion(question);
  };
  
  const handleFormSuccess = () => {
    setEditingQuestion(null);
    onUpdate();
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No custom questions yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first custom question to include in your surveys.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {questions.map((question) => (
            <div 
              key={question.id} 
              className={`p-4 hover:bg-gray-50 transition-colors flex items-center ${
                isSelectable ? 'cursor-pointer' : ''
              }`}
              onClick={isSelectable && onSelectQuestion ? () => onSelectQuestion(question.id) : undefined}
            >
              <div className="flex-grow">
                <div className="flex items-center space-x-2">
                  {isSelectable && (
                    <div className={`w-5 h-5 border rounded-md flex items-center justify-center transition-colors ${
                      selectedQuestions.includes(question.id) ? 'bg-brandPurple-500 border-brandPurple-500' : 'border-gray-300'
                    }`}>
                      {selectedQuestions.includes(question.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  <h3 className="font-medium text-gray-900">{question.text}</h3>
                </div>
                <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    question.type === 'text' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {question.type === 'text' ? 'Text Response' : 'Dropdown'}
                  </span>
                  {question.type === 'dropdown' && question.options && (
                    <span className="flex items-center">
                      <ListFilter size={14} className="mr-1" />
                      {question.options.length} {question.options.length === 1 ? 'option' : 'options'}
                    </span>
                  )}
                </div>
              </div>
              
              {!isSelectable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(question)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(question)}
                      className="text-red-600 focus:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this custom question?
              {deletingQuestion && (
                <p className="mt-2 font-medium text-gray-900">{deletingQuestion.text}</p>
              )}
              <p className="mt-2 text-red-600">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <QuestionForm 
              questionToEdit={editingQuestion} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setEditingQuestion(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsList;
