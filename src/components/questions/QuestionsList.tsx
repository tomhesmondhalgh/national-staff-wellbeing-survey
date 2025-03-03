
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { 
  Card,
  CardContent
} from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface QuestionItem {
  id: string;
  text: string;
  type: 'text' | 'dropdown';
  options: string[] | null;
  creator_id: string;
  created_at: string;
}

interface QuestionsListProps {
  questions: QuestionItem[];
  isLoading: boolean;
  onEdit: (question: QuestionItem) => void;
  onDelete: (questionId: string) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ 
  questions, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 my-8">
            No custom questions found. Click "New Question" to create your first custom question.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{question.text}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {question.type === 'text' ? 'Free Text' : 'Dropdown'}
                  </span>
                </div>
                
                {question.type === 'dropdown' && question.options && question.options.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Options:</p>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(question)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit size={16} />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Question</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this question? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(question.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionsList;
