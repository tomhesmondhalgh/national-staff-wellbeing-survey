
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useAuth } from '../contexts/AuthContext';
import QuestionForm from '../components/questions/QuestionForm';
import QuestionsList from '../components/questions/QuestionsList';
import { getUserCustomQuestions } from '../utils/customQuestionsUtils';
import { CustomQuestion } from '../types/customQuestions';
import { toast } from 'sonner';

const Questions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchQuestions = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const questionsData = await getUserCustomQuestions();
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchQuestions();
  };

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-8">
          <PageTitle 
            title="Custom Questions" 
            subtitle="Create and manage custom questions for your surveys"
            className="mb-0 text-left"
          />
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Question
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <QuestionsList 
            questions={questions} 
            onUpdate={fetchQuestions}
          />
        )}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
          </DialogHeader>
          <QuestionForm 
            onSuccess={handleAddSuccess} 
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Questions;
