
import React, { useState, useEffect } from 'react';
import { useCustomQuestions } from '../../hooks/useCustomQuestions';
import { Button } from '../ui/button';
import { CustomQuestion } from '../../types/customQuestions';
import { Check, ChevronDown, ChevronUp, FilePlus, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Badge } from '../ui/badge';
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from 'sonner';

interface CustomQuestionsSelectProps {
  selectedQuestionIds: string[];
  onChange: (selectedIds: string[]) => void;
}

const CustomQuestionsSelect: React.FC<CustomQuestionsSelectProps> = ({
  selectedQuestionIds,
  onChange
}) => {
  const { questions = [], isLoading, refreshQuestions } = useCustomQuestions();
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { isPremium, isProgress, isFoundation } = useSubscription();
  
  const hasAccess = isPremium || isProgress || isFoundation;
  
  // Filter out archived questions
  const availableQuestions = (questions || []).filter(q => !q.archived);
  
  // Function to toggle a question selection
  const toggleQuestion = (questionId: string) => {
    const newSelected = selectedQuestionIds.includes(questionId)
      ? selectedQuestionIds.filter(id => id !== questionId)
      : [...selectedQuestionIds, questionId];
    
    onChange(newSelected);
  };

  // Handle manual refresh with loading state
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshQuestions();
    } catch (error) {
      console.error("Error refreshing questions:", error);
      toast.error("Failed to refresh questions");
    } finally {
      setRefreshing(false);
    }
  };
  
  // Effect to safely refresh questions when component mounts or when opened
  useEffect(() => {
    if (hasAccess) {
      refreshQuestions().catch(err => {
        console.error("Error auto-refreshing questions:", err);
      });
    }
  }, [hasAccess]);
  
  // Second effect for when the collapsible is opened
  useEffect(() => {
    if (isOpen && hasAccess) {
      refreshQuestions().catch(err => {
        console.error("Error refreshing on open:", err);
      });
    }
  }, [isOpen, hasAccess]);
  
  if (!hasAccess) {
    return (
      <div className="mb-8 border border-gray-200 rounded-md p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Custom Questions</h3>
          <Badge variant="outline" className="bg-gray-100">Premium Feature</Badge>
        </div>
        <p className="text-gray-600 mb-4">
          Add your own custom questions to this survey. This feature requires a Foundation, Progress, or Premium plan.
        </p>
        <Button onClick={() => navigate('/upgrade')} variant="default">
          Upgrade to Access
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-gray-200 rounded-md">
        <div className="p-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium">Custom Questions</h3>
                {selectedQuestionIds.length > 0 && (
                  <Badge variant="secondary">{selectedQuestionIds.length} selected</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Button>
            </div>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <p className="text-gray-600 mb-4">
              Add your own custom questions to this survey. These will appear after the standard questions.
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/custom-questions')}
                className="flex items-center"
              >
                <FilePlus size={16} className="mr-2" />
                Manage Questions
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {isLoading || refreshing ? (
              <div className="py-8 text-center">
                <p>Loading questions...</p>
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 mb-4">You haven't created any custom questions yet.</p>
                <Button 
                  onClick={() => navigate('/custom-questions')}
                  className="flex items-center mx-auto"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Create Your First Question
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[250px] rounded-md border p-4">
                <div className="space-y-3">
                  {availableQuestions.map((question) => (
                    <div 
                      key={question.id} 
                      className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md"
                    >
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={selectedQuestionIds.includes(question.id)}
                        onCheckedChange={() => toggleQuestion(question.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`question-${question.id}`}
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {question.text}
                        </label>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            {question.type === 'text' ? 'Free Text' : 'Multiple Choice'}
                          </Badge>
                          {question.type === 'multiple-choice' && (
                            <span className="text-xs text-gray-500 ml-2">
                              {question.options?.length || 0} options
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default CustomQuestionsSelect;
