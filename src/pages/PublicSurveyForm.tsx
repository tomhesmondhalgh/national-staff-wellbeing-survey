
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
    // Enhanced logging for debugging
    if (surveyId) {
      console.log('PublicSurveyForm loaded with survey ID:', surveyId);
      console.log('Is preview mode?', isPreview);
    }
    
    // Log data specifically for the requested survey ID
    if (surveyId === 'c316b756-5b93-451f-b14e-2cc1df916def') {
      console.log('DEBUGGING TARGET SURVEY:', surveyId);
      console.log('Survey data available:', !!surveyData);
      console.log('Custom questions array:', customQuestions);
      console.log('Number of custom questions:', customQuestions ? customQuestions.length : 0);
      
      if (customQuestions && customQuestions.length > 0) {
        console.log('Custom questions details:', JSON.stringify(customQuestions, null, 2));
      } else {
        console.error('No custom questions found for this survey');
      }
    }
    
    if (customQuestions) {
      console.log('Custom questions available in component:', customQuestions);
      console.log('Number of custom questions:', customQuestions.length);
      
      if (customQuestions.length > 0) {
        customQuestions.forEach((q, i) => {
          console.log(`Question ${i+1}:`, { 
            id: q.id, 
            text: q.text, 
            type: q.type,
            options: q.options 
          });
        });
      } else {
        console.log('No custom questions are available for this survey');
      }
    }
  }, [surveyId, isPreview, customQuestions, surveyData]);
  
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
