
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const NewSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: SurveyFormData, customQuestionIds: string[]) => {
    try {
      setIsSubmitting(true);
      console.log('Survey data to be saved:', data);
      console.log('Custom question IDs:', customQuestionIds);
      
      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to create a survey."
        });
        return;
      }

      // Format the survey data for Supabase
      const surveyDate = new Date(data.date);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      
      // Save the survey to Supabase
      const { data: savedSurvey, error } = await supabase
        .from('survey_templates')
        .insert({
          name: data.name,
          date: surveyDate.toISOString(),
          close_date: closeDate ? closeDate.toISOString() : null,
          creator_id: user.id,
          emails: data.recipients
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Saved survey:', savedSurvey);

      // Add custom questions to the survey if any selected
      if (customQuestionIds.length > 0) {
        const surveyQuestionLinks = customQuestionIds.map(questionId => ({
          survey_id: savedSurvey.id,
          question_id: questionId
        }));
        
        const { error: linkError } = await supabase
          .from('survey_custom_questions')
          .insert(surveyQuestionLinks);
          
        if (linkError) {
          console.error('Error linking custom questions:', linkError);
          // Continue even if linking fails
        }
      }

      // Process and send emails if recipients are provided
      if (data.recipients && data.recipients.trim()) {
        // Generate survey link
        const baseUrl = window.location.origin;
        const surveyUrl = `${baseUrl}/survey?id=${savedSurvey.id}`;
        
        // Process email addresses: trim spaces, split by commas
        const emails = data.recipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        
        if (emails.length > 0) {
          // Call the Edge Function to send emails
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-survey-email', {
            body: {
              surveyId: savedSurvey.id,
              surveyName: data.name,
              emails: emails,
              surveyUrl: surveyUrl,
              isReminder: false
            }
          });
          
          if (emailError) {
            console.error('Error sending emails:', emailError);
            toast.error("Survey created but emails could not be sent", {
              description: "Your survey was created successfully, but there was an issue sending invitation emails."
            });
          } else {
            console.log('Email sending result:', emailResult);
            toast.success("Survey created and invitations sent", {
              description: `Invitations sent to ${emails.length} recipients.`
            });
          }
        }
      } else {
        // Show success toast notification without email info
        toast.success("Survey created successfully!", {
          description: "Your survey will be sent to staff on the specified date."
        });
      }
      
      // Navigate to the surveys page after success
      setTimeout(() => navigate('/surveys'), 1500);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error("Failed to create survey", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/surveys" onClick={(e) => { e.preventDefault(); navigate('/surveys'); }}>
                Surveys
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create New Survey</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title="Create New Survey" 
          subtitle="Set up a new wellbeing survey to send to your staff"
        />
        
        <SurveyForm 
          onSubmit={handleSubmit} 
          submitButtonText="Create Survey"
          isEdit={false} // This controls button centering - setting to false to center both buttons
          isSubmitting={isSubmitting}
        />
      </div>
    </MainLayout>
  );
};

export default NewSurvey;
