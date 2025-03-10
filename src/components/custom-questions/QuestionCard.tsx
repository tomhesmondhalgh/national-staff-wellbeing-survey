
import React, { useState } from 'react';
import { CustomQuestion } from '../../types/customQuestions';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArchiveIcon, Edit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface QuestionCardProps {
  question: CustomQuestion;
  onEdit: (question: CustomQuestion) => void;
  onArchive: (id: string, isArchived: boolean) => Promise<boolean>;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onEdit,
  onArchive
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await onArchive(question.id, question.archived);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className={question.archived ? "opacity-70" : ""}>
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
          onClick={handleArchive}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <RefreshCw size={16} className="mr-1 animate-spin" />
          ) : (
            <ArchiveIcon size={16} className="mr-1" />
          )}
          {question.archived ? 'Unarchive' : 'Archive'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuestionCard;
