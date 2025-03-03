
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
        console.error("No survey ID provided in URL parameters");
        setError("No survey ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Loading survey with ID:", surveyId);
        setLoading(true);
        
        // Debug the API call to getSurveyById
        console.log("About to call getSurveyById...");
        const surveyData = await getSurveyById(surveyId);
        console.log("Survey data returned:", surveyData);
        
        if (surveyData) {
          console.log("Setting survey state with data:", surveyData);
          setSurvey(surveyData);
          
          // Log the values we're setting
          console.log("Setting name to:", surveyData.name ? String(surveyData.name) : '');
          console.log("Setting date to:", surveyData.date ? new Date(surveyData.date) : undefined);
          console.log("Setting closeDate to:", surveyData.close_date ? new Date(surveyData.close_date) : undefined);
          
          // Cast the values to the proper types before setting state
          setName(surveyData.name ? String(surveyData.name) : '');
          setDate(surveyData.date ? new Date(surveyData.date) : undefined);
          setCloseDate(surveyData.close_date ? new Date(surveyData.close_date) : undefined);
          
          if ('emails' in surveyData) {
            console.log("Setting emails to:", surveyData.emails ? String(surveyData.emails) : '');
            setEmails(surveyData.emails ? String(surveyData.emails) : '');
          }
        } else {
          console.error("Survey data not found for ID:", surveyId);
          setError("Survey not found");
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        setError(`Failed to load survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast.error("Failed to load survey");
      } finally {
        console.log("Finished loading survey, setting loading to false");
        setLoading(false);
      }
    };

    loadSurvey();
  }, [surveyId, setName, setDate, setCloseDate, setEmails]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) {
        console.log("No user, skipping custom questions fetch");
        return;
      }
      
      try {
        setIsLoadingQuestions(true);
        console.log("Fetching custom questions for user");
        const questions = await getUserCustomQuestions();
        console.log("Custom questions fetched:", questions);
        setCustomQuestions(questions);
      } catch (error) {
        console.error('Error loading custom questions:', error);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [user]);

  useEffect(() => {
    const loadCustomQuestions = async () => {
      if (!survey) {
        console.log("No survey, skipping survey custom questions fetch");
        return;
      }
      
      try {
        console.log("Fetching custom questions for survey:", survey.id);
        const questions = await getSurveyCustomQuestions(survey.id);
        console.log("Survey custom questions fetched:", questions);
        setCustomQuestions(questions);
      } catch (error) {
        console.error('Error loading custom questions:', error);
      }
    };
    
    loadCustomQuestions();
  }, [survey]);

  const onSubmitForm = (e: React.FormEvent) => {
    console.log("Form submit triggered");
    handleSubmit(e, customQuestions);
  };

  // Show loading state while data is being fetched
  if (loading) {
    console.log("Rendering loading state");
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
    console.log("Rendering error state:", error);
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
    console.log("Rendering survey not found state");
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

  console.log("Rendering survey form with data:", { name, date, closeDate, emails });

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
