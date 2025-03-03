
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { getSurveyById } from '../utils/surveyUtils';
import CustomQuestions from '../components/survey-form/CustomQuestions';
import { getSurveyCustomQuestions } from '../utils/customQuestionsUtils';
import { getUserCustomQuestions } from '../utils/customQuestionsUtils';
import { CustomQuestion } from '../types/customQuestions';
import { toast } from "sonner";

// Import refactored components
import SurveyBasicFields from '../components/survey-form/SurveyBasicFields';
import SurveyDateFields from '../components/survey-form/SurveyDateFields';
import CustomQuestionsSection from '../components/survey-form/CustomQuestionsSection';
import QuestionsDialog from '../components/survey-form/QuestionsDialog';
import { useSurveyForm } from '../hooks/useSurveyForm';

const SurveyForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');

  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  const {
    name,
    setName,
    date,
    setDate,
    closeDate,
    setCloseDate,
    emails,
    setEmails,
    isSubmitting,
    nameError,
    dateError,
    emailsError,
    selectedQuestions,
    customQuestionValues,
    customQuestionErrors,
    handleSelectQuestion,
    handleCustomQuestionChange,
    handleSubmit,
    handleChange
  } = useSurveyForm(surveyId);

  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) {
        setError("No survey ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Loading survey with ID:", surveyId);
        setLoading(true);
        const surveyData = await getSurveyById(surveyId);
        console.log("Survey data loaded:", surveyData);
        
        if (surveyData) {
          setSurvey(surveyData);
          // Cast the values to the proper types before setting state
          setName(surveyData.name ? String(surveyData.name) : '');
          setDate(surveyData.date ? new Date(surveyData.date) : undefined);
          setCloseDate(surveyData.close_date ? new Date(surveyData.close_date) : undefined);
          if ('emails' in surveyData) {
            setEmails(surveyData.emails ? String(surveyData.emails) : '');
          }
        } else {
          setError("Survey not found");
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        setError("Failed to load survey");
        toast.error("Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    loadSurvey();
  }, [surveyId, setName, setDate, setCloseDate, setEmails]);

  const fetchCustomQuestions = async () => {
    if (!user) return;
    
    try {
      setIsLoadingQuestions(true);
      const questions = await getUserCustomQuestions();
      setCustomQuestions(questions);
    } catch (error) {
      console.error('Error loading custom questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchCustomQuestions();
  }, [user]);

  useEffect(() => {
    const loadCustomQuestions = async () => {
      if (!survey) return;
      
      try {
        const questions = await getSurveyCustomQuestions(survey.id);
        setCustomQuestions(questions);
      } catch (error) {
        console.error('Error loading custom questions:', error);
      }
    };
    
    loadCustomQuestions();
  }, [survey]);

  const onSubmitForm = (e: React.FormEvent) => {
    handleSubmit(e, customQuestions);
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-700">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Show error state if there was a problem
  if (error) {
    return (
      <div className="page-container">
        <div className="card animate-slide-up p-8 text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate('/surveys')}>
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  // If survey wasn't found
  if (!survey) {
    return (
      <div className="page-container">
        <div className="card animate-slide-up p-8 text-center">
          <div className="text-amber-500 text-xl mb-4">Survey Not Found</div>
          <p className="text-gray-700 mb-6">The survey you are looking for doesn't exist or has been removed.</p>
          <Button variant="outline" onClick={() => navigate('/surveys')}>
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card animate-slide-up">
        <form onSubmit={onSubmitForm} className="grid gap-6">
          <SurveyBasicFields
            name={name}
            emails={emails}
            onNameChange={setName}
            onEmailsChange={setEmails}
            nameError={nameError}
            emailsError={emailsError}
          />

          <SurveyDateFields
            date={date}
            closeDate={closeDate}
            onDateChange={setDate}
            onCloseDateChange={setCloseDate}
            dateError={dateError}
          />
          
          <CustomQuestionsSection
            selectedQuestions={selectedQuestions}
            customQuestions={customQuestions}
            onSelectQuestion={handleSelectQuestion}
            onShowQuestionsDialog={() => setShowQuestionsDialog(true)}
          />
          
          <div className="custom-questions-section">
            <CustomQuestions 
              questions={customQuestions}
              values={customQuestionValues}
              onChange={handleCustomQuestionChange}
              errors={customQuestionErrors}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Survey...' : 'Create Survey'}
          </Button>
        </form>
      </div>
      
      <QuestionsDialog
        open={showQuestionsDialog}
        onOpenChange={setShowQuestionsDialog}
        customQuestions={customQuestions}
        selectedQuestions={selectedQuestions}
        onSelectQuestion={handleSelectQuestion}
        isLoadingQuestions={isLoadingQuestions}
      />
    </div>
  );
};

export default SurveyForm;
