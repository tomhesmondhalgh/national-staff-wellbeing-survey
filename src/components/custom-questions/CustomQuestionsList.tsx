
import React from 'react';
import { CustomQuestion } from '../../types/customQuestions';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  ArchiveIcon, 
  FilePlus, 
  List, 
  MessageSquare, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import QuestionCard from './QuestionCard';

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
  const { isPremium, isProgress, isFoundation } = useSubscription();
  const navigate = useNavigate();
  const hasAccess = isPremium || isProgress || isFoundation;

  // Premium plan required notice
  if (!hasAccess) {
    return (
      <Card className="mb-8">
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-end mt-4">
                <Skeleton className="h-9 w-20 mr-2" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header with actions */}
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
      
      {/* Empty state */}
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
        /* Question cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomQuestionsList;
