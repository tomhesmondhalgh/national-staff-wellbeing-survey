import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import CustomQuestionsList from '../components/custom-questions/CustomQuestionsList';
import CustomQuestionModal from '../components/custom-questions/CustomQuestionModal';
import { useCustomQuestions } from '../hooks/useCustomQuestions';
import { CustomQuestion } from '../types/customQuestions';
import { useToast } from '../components/ui/use-toast';
import { useTestingMode } from '../contexts/TestingModeContext';
import { Badge } from '../components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../components/ui/alert";

const CustomQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isTestingMode } = useTestingMode();
  const {
    questions,
    isLoading,
    error,
    createQuestion,
    updateQuestion,
    toggleArchiveQuestion,
    showArchived,
    toggleShowArchived,
    refreshQuestions
  } = useCustomQuestions();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomQuestion | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Force a refresh when the component mounts
  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshQuestions();
    setIsRefreshing(false);
  };
  
  const handleAddQuestion = () => {
    setSelectedQuestion(undefined);
    setModalOpen(true);
  };
  
  const handleEditQuestion = (question: CustomQuestion) => {
    setSelectedQuestion(question);
    setModalOpen(true);
  };
  
  const handleSaveQuestion = async (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    try {
      if (selectedQuestion) {
        // Update existing question
        const result = await updateQuestion(selectedQuestion.id, questionData);
        if (result) {
          toast({
            title: "Question updated",
            description: "Your custom question has been updated successfully."
          });
        }
        return result;
      } else {
        // Create new question
        const result = await createQuestion(questionData);
        if (result) {
          toast({
            title: "Question created",
            description: "Your custom question has been created successfully."
          });
        }
        return !!result;
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your question. Please try again.",
        variant: "destructive"
      });
      return false;
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
          <div className="flex items-center gap-4">
            <PageTitle 
              title="Custom Questions" 
              subtitle="Create and manage your custom survey questions"
            />
            {isTestingMode && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                Testing Mode
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="icon"
              disabled={isRefreshing}
              title="Refresh questions"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
              <ArrowLeft size={16} className="mr-2" />
              Back to Survey
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem loading your custom questions. 
              <Button 
                variant="link" 
                onClick={handleRefresh}
                className="px-0 py-0 h-auto text-destructive-foreground underline"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
