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
import { toast } from 'sonner';

const CustomQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomQuestion | undefined>(undefined);
  
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
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access this page');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleAddQuestion = () => {
    try {
      setSelectedQuestion(undefined);
      setModalOpen(true);
    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open question form');
    }
  };
  
  const handleEditQuestion = (question: CustomQuestion) => {
    try {
      setSelectedQuestion(question);
      setModalOpen(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      toast.error('Failed to open edit form');
    }
  };
  
  const handleSaveQuestion = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    try {
      if (selectedQuestion) {
        return await updateQuestion(selectedQuestion.id, questionData);
      } else {
        const result = await createQuestion(questionData);
        if (result) {
          setModalOpen(false);
          await refreshQuestions();
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
      return false;
    }
  };

  const handleRefresh = () => {
    refreshQuestions();
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <PageTitle 
              title="Loading..." 
              subtitle="Please wait while we check your authentication status"
            />
          </div>
        </div>
      </MainLayout>
    );
  }

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
          questions={questions || []}
          isLoading={isLoading}
          onEdit={handleEditQuestion}
          onArchive={toggleArchiveQuestion}
          showArchived={showArchived}
          onToggleArchived={toggleShowArchived}
          onRefresh={handleRefresh}
          onAdd={handleAddQuestion}
        />
        
        {modalOpen && (
          <CustomQuestionModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSave={handleSaveQuestion}
            initialData={selectedQuestion}
            isEdit={!!selectedQuestion}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default CustomQuestions;
