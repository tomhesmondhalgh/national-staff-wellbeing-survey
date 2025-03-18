
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SurveyForm, { SurveyFormData } from '../pages/SurveyForm';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const PublicSurveyForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');
  const isPreview = searchParams.get('preview') === 'true';
  
  const handleSubmit = async (data: SurveyFormData, selectedQuestionIds: string[]) => {
    try {
      // Logic for submitting the survey response
      toast.success('Survey submitted successfully');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Wellbeing Survey</h1>
      <SurveyForm
        initialData={null}
        onSubmit={handleSubmit}
        submitButtonText="Submit Survey"
        isEdit={false}
        surveyId={surveyId || undefined}
        isSubmitting={false}
      />
    </div>
  );
};

export default PublicSurveyForm;
