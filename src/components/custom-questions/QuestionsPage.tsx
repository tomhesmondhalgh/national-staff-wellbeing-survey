
import React, { useEffect, useState } from 'react';
import { useQuestionStore } from '../../hooks/useQuestionStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Archive, Edit, Plus, ListChecks, AlignLeft } from 'lucide-react';
import QuestionModal from './QuestionModal';
import { CustomQuestion } from '../../types/customQuestions';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export default function QuestionsPage() {
  const { questions, isLoading, fetchQuestions, createQuestion, updateQuestion } = useQuestionStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomQuestion | undefined>();
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      await fetchQuestions(showArchived);
    };
    loadQuestions();
  }, [showArchived]);

  const handleCreate = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>) => {
    await createQuestion(questionData);
    setModalOpen(false);
  };

  const handleEdit = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>) => {
    if (selectedQuestion) {
      await updateQuestion(selectedQuestion.id, questionData);
      setSelectedQuestion(undefined);
      setModalOpen(false);
    }
  };

  const handleArchive = async (question: CustomQuestion) => {
    await updateQuestion(question.id, { archived: !question.archived });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p>Loading questions...</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    if (type === 'text') return <AlignLeft className="h-4 w-4" />;
    if (type === 'multiple-choice') return <ListChecks className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Custom Questions</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="whitespace-nowrap"
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedQuestion(undefined);
              setModalOpen(true);
            }}
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4 text-center">No questions found.</p>
          <Button 
            onClick={() => {
              setSelectedQuestion(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Question
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question) => (
            <Card 
              key={question.id} 
              className={cn(
                "transition-all hover:shadow-md",
                question.archived ? "opacity-60 bg-muted/30" : ""
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1 font-normal"
                  >
                    {getTypeIcon(question.type)}
                    {question.type === 'text' ? 'Text' : 'Multiple Choice'}
                  </Badge>
                  {question.archived && (
                    <Badge variant="secondary" className="ml-auto">Archived</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CardTitle className="text-base line-clamp-2">
                    {question.text}
                  </CardTitle>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setModalOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(question)}
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" />
                      {question.archived ? 'Restore' : 'Archive'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={selectedQuestion ? handleEdit : handleCreate}
        initialData={selectedQuestion}
      />
    </div>
  );
}
