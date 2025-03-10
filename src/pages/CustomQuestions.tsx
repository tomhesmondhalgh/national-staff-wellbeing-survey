
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useCustomQuestions } from '../hooks/useCustomQuestions';
import CustomQuestionsList from '../components/custom-questions/CustomQuestionsList';
import CustomQuestionModal from '../components/custom-questions/CustomQuestionModal';
import { CustomQuestion } from '../types/customQuestions';

const CustomQuestions: React.FC = () => {
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
        <PageTitle
          title="Custom Questions"
          subtitle="Create your own questions to include in surveys"
        />
        
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
