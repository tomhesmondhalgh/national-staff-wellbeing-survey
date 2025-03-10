import React, { useEffect, useState } from 'react';
import { useQuestionStore } from '../../hooks/useQuestionStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Archive, Edit, Plus } from 'lucide-react';
import QuestionModal from './QuestionModal';
import { CustomQuestion } from '../../types/customQuestions';
import { Badge } from '../ui/badge';

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

  const handleCreate = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    await createQuestion(questionData);
    setModalOpen(false);
  };

  const handleEdit = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Questions</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button
            onClick={() => {
              setSelectedQuestion(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found. Click 'Add Question' to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((question) => (
            <Card key={question.id} className={question.archived ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">
                  {question.text}
                </CardTitle>
                {question.archived && (
                  <Badge variant="outline">Archived</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge>
                    {question.type === 'text' ? 'Free Text' : 'Multiple Choice'}
                  </Badge>
                  {question.type === 'multiple-choice' && question.options && (
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {question.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(question)}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      {question.archived ? 'Unarchive' : 'Archive'}
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
