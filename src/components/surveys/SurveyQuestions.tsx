
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Plus, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Link } from 'react-router-dom';
import { QuestionItem } from '../questions/QuestionsList';

interface SurveyQuestionsProps {
  userId: string;
  selectedQuestions: string[];
  onQuestionsChange: (questionIds: string[]) => void;
  disabled?: boolean;
}

const SurveyQuestions: React.FC<SurveyQuestionsProps> = ({ 
  userId, 
  selectedQuestions, 
  onQuestionsChange,
  disabled = false
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const { supabase } = await import('../../lib/supabase');
        
        const { data, error } = await supabase
          .from('custom_questions')
          .select('*')
          .eq('creator_id', userId);
        
        if (error) throw error;
        
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestions();
  }, [userId]);
  
  const handleQuestionToggle = (questionId: string) => {
    if (disabled) return;
    
    const newSelectedQuestions = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter(id => id !== questionId)
      : [...selectedQuestions, questionId];
    
    onQuestionsChange(newSelectedQuestions);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Questions</CardTitle>
            <CardDescription>Select custom questions to add to your survey</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <HelpCircle size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-80">
                  Custom questions appear at the end of your standard survey questions. 
                  You can add your own questions to gather specific information from your staff.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">
              You haven't created any custom questions yet
            </p>
            <Link to="/questions">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Create Questions
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="flex items-start space-x-2">
                <Checkbox 
                  id={`question-${question.id}`} 
                  checked={selectedQuestions.includes(question.id)}
                  onCheckedChange={() => handleQuestionToggle(question.id)}
                  disabled={disabled}
                />
                <div>
                  <label 
                    htmlFor={`question-${question.id}`} 
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    {question.text}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {question.type === 'text' ? 'Free Text' : 'Dropdown'}
                    {question.type === 'dropdown' && question.options && (
                      <> · {question.options.length} options</>
                    )}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="mt-4 border-t pt-4">
              <Link to="/questions">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus size={14} />
                  Create New Question
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SurveyQuestions;
