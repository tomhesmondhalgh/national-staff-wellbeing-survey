
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSurveyData } from '../hooks/useSurveyData';
import { useSurveyForm } from '../hooks/useSurveyForm';
import SurveyLoading from '../components/survey-form/SurveyLoading';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import SurveyFormWrapper from '../components/survey-form/SurveyFormWrapper';

const PublicSurveyForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const surveyId = searchParams.get('id');
  const isPreview = searchParams.get('preview') === 'true';
  
  const { 
    isLoading, 
    surveyData, 
    customQuestions 
  } = useSurveyData(surveyId, isPreview);
  
  const {
    formData,
    isSubmitting,
    handleInputChange,
    handleCustomQuestionResponse,
    submitForm
  } = useSurveyForm(surveyId, isPreview);
  
  useEffect(() => {
    // Check specifically for the target survey ID
    if (surveyId === 'c316b756-5b93-451f-b14e-2cc1df916def') {
      console.log('==== TARGET SURVEY DEBUGGING ====');
      console.log('Survey ID:', surveyId);
      console.log('Survey data loaded:', !!surveyData);
      
      if (surveyData) {
        console.log('Survey name:', surveyData.name);
        console.log('Is preview mode:', isPreview);
      }
      
      console.log('Custom questions array present:', !!customQuestions);
      console.log('Custom questions length:', customQuestions ? customQuestions.length : 0);
      
      if (customQuestions && customQuestions.length > 0) {
        console.log('Custom questions details:');
        customQuestions.forEach((q, i) => {
          console.log(`Question ${i+1}:`, {
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options
          });
        });
      } else {
        console.error('No custom questions found for the target survey - checking if any data is missing in the flow');
        console.log('Survey ID is correctly passed to useSurveyData:', surveyId);
        console.log('isPreview flag is set correctly:', isPreview);
      }
      console.log('==== END TARGET SURVEY DEBUGGING ====');
    }
  }, [surveyId, surveyData, customQuestions, isPreview]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    console.log('Custom responses being submitted:', formData.custom_responses);
    await submitForm(navigate);
  };
  
  if (isLoading) {
    return <SurveyLoading />;
  }
  
  if (!surveyId || !surveyData) {
    return <SurveyNotFound />;
  }
  
  return (
    <SurveyFormWrapper
      surveyTemplate={surveyData}
      formData={formData}
      customQuestions={customQuestions}
      isSubmitting={isSubmitting}
      isPreview={isPreview}
      handleInputChange={handleInputChange}
      handleCustomQuestionResponse={handleCustomQuestionResponse}
      handleSubmit={handleSubmit}
    />
  );
};

export default PublicSurveyForm;
