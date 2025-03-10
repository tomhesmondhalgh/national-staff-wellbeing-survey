
import React, { useState } from 'react';
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

const CustomQuestions: React.FC = () => {
  const navigate = useNavigate();
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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomQuestion | undefined>(undefined);
  
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
          onRefresh={refreshQuestions}
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
