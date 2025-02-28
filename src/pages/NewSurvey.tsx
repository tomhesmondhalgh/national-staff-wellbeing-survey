
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { toast } from "sonner";

const NewSurvey = () => {
  const navigate = useNavigate();

  const handleSubmit = (data: SurveyFormData) => {
    console.log('Survey data:', data);
    
    // In a real application, you would create the survey here
    // For now, we'll just show a success toast and redirect

    // Show toast notification
    toast.success("Survey created successfully!", {
      description: "Your survey will be sent to staff on the specified date."
    });
    
    // We don't immediately redirect so the user can see the survey URL
    // setTimeout(() => navigate('/surveys'), 3000);
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Create New Survey" 
          subtitle="Set up a new wellbeing survey to send to your staff"
        />
        
        <SurveyForm onSubmit={handleSubmit} />
      </div>
    </MainLayout>
  );
};

export default NewSurvey;
