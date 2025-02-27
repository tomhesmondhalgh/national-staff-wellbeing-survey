
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { createSurvey } from '../lib/db';

const NewSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);

  const handleSubmit = async (data: SurveyFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a survey');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await createSurvey({
        name: data.name,
        date: data.date,
        close_date: data.closeDate,
        status: new Date(data.date) <= new Date() ? 'Sent' : 'Scheduled',
        user_id: user.id,
      });

      if (result.error) {
        throw result.error;
      }

      // Store the survey URL to display to the user
      setSurveyUrl(result.data?.url || null);
      
      // Show toast notification
      toast.success("Survey created successfully!", {
        description: "Your survey will be sent to staff on the specified date."
      });
      
      // We only redirect after a delay so the user can see the survey URL
      setTimeout(() => navigate('/surveys'), 3000);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error('Failed to create survey', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Create New Survey" 
          subtitle="Set up a new wellbeing survey to send to your staff"
        />
        
        <SurveyForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          initialData={{ surveyUrl }}
        />
      </div>
    </MainLayout>
  );
};

export default NewSurvey;
