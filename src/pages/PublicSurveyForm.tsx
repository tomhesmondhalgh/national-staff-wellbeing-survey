
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
  }, [surveyId, isPreview, customQuestions]);
  
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
