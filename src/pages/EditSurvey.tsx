import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const EditSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [survey, setSurvey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) {
        toast.error("Survey ID is required");
        navigate('/surveys');
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('survey_templates')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setSurvey(data);
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast.error("Failed to load survey");
        navigate('/surveys');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id, navigate]);

  const handleSubmit = async (data: SurveyFormData, questions: string[]) => {
    try {
      setIsSubmitting(true);
      console.log('Survey data to be updated:', data);
      console.log('Custom questions to be added:', questions);
      
      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to edit a survey."
        });
        return;
      }

      if (!survey) {
        toast.error("Survey not loaded", {
          description: "Please wait for the survey to load before submitting."
        });
        return;
      }

      // Format the survey data for Supabase
      const surveyDate = new Date(data.date);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      
      // Update the survey in Supabase
      const { data: updatedSurvey, error } = await supabase
        .from('survey_templates')
        .update({
          name: data.name,
          date: surveyDate.toISOString(),
          close_date: closeDate ? closeDate.toISOString() : null,
          emails: data.recipients
        })
        .eq('id', survey.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Updated survey:', updatedSurvey);

      // Delete existing survey questions and add the new ones
      const { error: deleteError } = await supabase
        .from('survey_questions')
        .delete()
        .eq('survey_id', survey.id);

      if (deleteError) {
        console.error('Error deleting existing custom questions:', deleteError);
        toast.error("Failed to update custom questions", {
          description: "There was an issue updating custom questions."
        });
      }

      // If custom questions were selected, create survey_questions records
      if (questions.length > 0) {
        const surveyQuestionsData = questions.map(questionId => ({
          survey_id: survey.id,
          question_id: questionId
        }));

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(surveyQuestionsData);

        if (questionsError) {
          console.error('Error adding custom questions:', questionsError);
          toast.error("Failed to add custom questions", {
            description: "Your survey was updated, but there was an issue adding custom questions."
          });
        }
      }

      // Process and send emails if recipients are provided
      if (data.recipients && data.recipients.trim()) {
        // Generate survey link
        const baseUrl = window.location.origin;
        const surveyUrl = `${baseUrl}/survey?id=${survey.id}`;
        
        // Process email addresses: trim spaces, split by commas
        const emails = data.recipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        
        if (emails.length > 0) {
          // Call the Edge Function to send emails
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-survey-email', {
            body: {
              surveyId: survey.id,
              surveyName: data.name,
              emails: emails,
              surveyUrl: surveyUrl,
              isReminder: false
            }
          });
          
          if (emailError) {
            console.error('Error sending emails:', emailError);
            toast.error("Survey updated but emails could not be sent", {
              description: "Your survey was updated successfully, but there was an issue sending invitation emails."
            });
          } else {
            console.log('Email sending result:', emailResult);
            toast.success("Survey updated and invitations sent", {
              description: `Invitations sent to ${emails.length} recipients.`
            });
          }
        }
      } else {
        // Show success toast notification without email info
        toast.success("Survey updated successfully!", {
          description: "Your survey will be sent to staff on the specified date."
        });
      }
      
      // Navigate to the surveys page after success
      setTimeout(() => navigate('/surveys'), 1500);
    } catch (error) {
      console.error('Error updating survey:', error);
      toast.error("Failed to update survey", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading survey...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!survey) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="text-center py-12">
            <p className="text-red-500">Survey not found.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const initialValues = {
    name: survey.name || '',
    date: survey.date ? new Date(survey.date) : new Date(),
    closeDate: survey.close_date ? new Date(survey.close_date) : null,
    recipients: survey.emails || ''
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
              <BreadcrumbPage>Edit Survey</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title="Edit Survey" 
          subtitle="Update the details of your wellbeing survey"
        />
        
        <SurveyForm 
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitButtonText="Update Survey"
          isEdit={true}
          isSubmitting={isSubmitting}
        />
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
