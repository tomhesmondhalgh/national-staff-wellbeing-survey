
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSurveyData } from '../hooks/useSurveyData';
import { useSurveyForm } from '../hooks/useSurveyForm';
import SurveyLoading from '../components/survey-form/SurveyLoading';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import SurveyFormWrapper from '../components/survey-form/SurveyFormWrapper';
import { toast } from 'sonner';

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
    // Verify data loaded for any survey
    if (surveyId && surveyData) {
      console.log(`Survey data loaded for ID: ${surveyId}`);
      console.log('Custom questions count:', customQuestions?.length || 0);
      
      if (customQuestions?.length === 0) {
        console.log('Note: This survey has no custom questions linked to it.');
      }
    }
  }, [surveyId, surveyData, customQuestions]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    console.log('Custom responses being submitted:', formData.custom_responses);
    
    try {
      await submitForm(navigate);
      toast.success('Survey submitted successfully');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey');
    }
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
