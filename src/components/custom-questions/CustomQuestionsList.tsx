
import React, { useState } from 'react';
import { CustomQuestion } from '../../types/customQuestions';
import { Button } from '../ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { 
  ArchiveIcon, 
  Edit, 
  FilePlus, 
  List, 
  ListFilter, 
  MessageSquare, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import CustomQuestionModal from './CustomQuestionModal';

interface CustomQuestionsListProps {
  questions: CustomQuestion[];
  isLoading: boolean;
  onEdit: (question: CustomQuestion) => void;
  onArchive: (id: string, isArchived: boolean) => Promise<boolean>;
  showArchived: boolean;
  onToggleArchived: () => void;
  onRefresh: () => void;
  onAdd: () => void;
}

const CustomQuestionsList: React.FC<CustomQuestionsListProps> = ({
  questions,
  isLoading,
  onEdit,
  onArchive,
  showArchived,
  onToggleArchived,
  onRefresh,
  onAdd
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { isPremium, isProgress, isFoundation } = useSubscription();
  const navigate = useNavigate();
  
  const handleArchive = async (id: string, isArchived: boolean) => {
    setProcessingId(id);
    await onArchive(id, isArchived);
    setProcessingId(null);
  };

  if (!isPremium && !isProgress && !isFoundation) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Custom Questions</CardTitle>
          <CardDescription>
            This feature is available with Foundation, Progress, and Premium plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MessageSquare size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unlock Custom Questions</h3>
          <p className="text-center text-gray-500 mb-4">
            Create your own custom questions to add to surveys and gain deeper insights.
          </p>
          <Button onClick={() => navigate('/upgrade')}>
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-20 mr-2" />
              <Skeleton className="h-10 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Custom Questions</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh} 
            title="Refresh questions"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="default" // Changed from "sm" to "default" to match the Add Question button
            onClick={onToggleArchived}
            className="flex items-center"
          >
            {showArchived ? (
              <>
                <ToggleRight size={18} className="mr-2" /> 
                Hide Archived
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="mr-2" /> 
                Show Archived
              </>
            )}
          </Button>
          <Button onClick={onAdd} className="flex items-center">
            <FilePlus size={18} className="mr-2" /> 
            Add Question
          </Button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <List size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
            <p className="text-gray-500 mb-6">
              {showArchived 
                ? "You don't have any archived custom questions."
                : "You haven't created any custom questions yet."}
            </p>
            {!showArchived && (
              <Button onClick={onAdd}>
                Create Your First Question
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question) => (
            <Card key={question.id} className={question.archived ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{question.text}</CardTitle>
                  {question.archived && (
                    <Badge variant="outline" className="bg-gray-100">
                      Archived
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {question.created_at && (
                    <span>Created {format(new Date(question.created_at), 'MMM d, yyyy')}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <Badge className="mb-2">
                    {question.type === 'text' ? 'Free Text' : 'Multiple Choice'}
                  </Badge>
                </div>
                {question.type === 'multiple-choice' && question.options && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Options:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {question.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(question)}
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
                <Button 
                  variant={question.archived ? "default" : "secondary"} 
                  size="sm" 
                  onClick={() => handleArchive(question.id, question.archived)}
                  disabled={processingId === question.id}
                >
                  {processingId === question.id ? (
                    <RefreshCw size={16} className="mr-1 animate-spin" />
                  ) : (
                    <ArchiveIcon size={16} className="mr-1" />
                  )}
                  {question.archived ? 'Unarchive' : 'Archive'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomQuestionsList;
