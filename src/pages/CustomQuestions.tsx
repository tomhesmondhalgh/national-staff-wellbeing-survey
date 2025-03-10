
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import CustomQuestionsList from '../components/custom-questions/CustomQuestionsList';
import CustomQuestionModal from '../components/custom-questions/CustomQuestionModal';
import { useCustomQuestions } from '../hooks/useCustomQuestions';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';

const CustomQuestions: React.FC = () => {
  console.log('Rendering CustomQuestions page');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    console.log('CustomQuestions page mounted, auth state:', user ? 'logged in' : 'not logged in');
    if (!user) {
      console.log('No user found, redirecting to login');
      toast({
        title: 'Authentication required',
        description: 'Please log in to access this page',
        variant: 'destructive'
      });
    }
  }, [user, toast]);
  
  const {
    questions,
    isLoading,
    createQuestion,
    updateQuestion,
    toggleArchiveQuestion,
    showArchived,
    toggleShowArchived,
    refreshQuestions
  } = useCustomQuestions();
  
  console.log('Current showArchived state:', showArchived);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomQuestion | undefined>(undefined);
  
  useEffect(() => {
    console.log('Questions loaded:', questions.length);
    console.log('Is loading:', isLoading);
    console.log('Show archived:', showArchived);
  }, [questions, isLoading, showArchived]);
  
  const handleAddQuestion = () => {
    setSelectedQuestion(undefined);
    setModalOpen(true);
  };
  
  const handleEditQuestion = (question: CustomQuestion) => {
    setSelectedQuestion(question);
    setModalOpen(true);
  };
  
  const handleSaveQuestion = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (selectedQuestion) {
      // Update existing question
      return updateQuestion(selectedQuestion.id, questionData);
    } else {
      // Create new question
      return createQuestion(questionData);
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refreshQuestions();
  };

  return (
    <MainLayout>
      <div className="page-container">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate(-1)}>Back</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Custom Questions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <PageTitle 
            title="Custom Questions" 
            subtitle="Create and manage your custom survey questions"
          />
          <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            Back to Survey
          </Button>
        </div>

        <CustomQuestionsList
          questions={questions}
          isLoading={isLoading}
          onEdit={handleEditQuestion}
          onArchive={toggleArchiveQuestion}
          showArchived={showArchived}
          onToggleArchived={toggleShowArchived}
          onRefresh={handleRefresh}
          onAdd={handleAddQuestion}
        />
        
        <CustomQuestionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSave={handleSaveQuestion}
          initialData={selectedQuestion}
          isEdit={!!selectedQuestion}
        />
      </div>
    </MainLayout>
  );
};

export default CustomQuestions;
