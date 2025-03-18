
import React, { useState, useEffect } from 'react';
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
import SurveyLoading from '../components/survey-form/SurveyLoading';
import { sendUserToHubspot } from '../utils/authUtils';

const NewSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSurveyId, setSavedSurveyId] = useState<string | null>(null);
  
  // Known Hubspot ID for this user (in case of previous 409 errors)
  const knownHubspotId = "31923701"; // Adding the known ID from your error message

  useEffect(() => {
    if (!user) {
      setIsLoading(true);
      const checkUser = setTimeout(() => {
        if (!user) {
          toast.error("Authentication required", {
            description: "You must be logged in to create a survey."
          });
          navigate('/login');
        }
        setIsLoading(false);
      }, 1000); // Give auth some time to load

      return () => clearTimeout(checkUser);
    }
  }, [user, navigate]);

  const handleSubmit = async (data: SurveyFormData, customQuestionIds: string[]) => {
    try {
      setIsSubmitting(true);
      console.log('Survey data to be saved:', data);
      console.log('Custom question IDs:', customQuestionIds);
      
      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to create a survey."
        });
        navigate('/login');
        return;
      }

      const surveyDate = new Date(data.date);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      
      // Save the survey with status "Saved"
      const { data: savedSurvey, error } = await supabase
        .from('survey_templates')
        .insert({
          name: data.name,
          date: surveyDate.toISOString(),
          close_date: closeDate ? closeDate.toISOString() : null,
          creator_id: user.id,
          emails: data.recipients,
          status: 'Saved' // Add the new status
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Saved survey:', savedSurvey);
      
      setSavedSurveyId(savedSurvey.id);

      // Link custom questions if any
      if (customQuestionIds && customQuestionIds.length > 0) {
        const surveyQuestionLinks = customQuestionIds.map(questionId => ({
          survey_id: savedSurvey.id,
          question_id: questionId
        }));
        
        const { error: linkError } = await supabase
          .from('survey_questions')
          .insert(surveyQuestionLinks);
          
        if (linkError) {
          console.error('Error linking custom questions:', linkError);
        }
      }
      
      // Get user profile data to send to Hubspot
      console.log('Fetching user profile data for Hubspot integration...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, job_title, school_name, school_address')
        .eq('id', user.id)
        .single();
      
      // Log profile retrieval result
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      } else {
        console.log('Profile data retrieved:', profileData);
      }
        
      if (!profileError && profileData && user.email) {
        console.log('Attempting to send user data to Hubspot list 5418...');
        try {
          // Send user to Hubspot with list ID 5418, using email from auth user
          // Pass the known Hubspot ID to avoid 409 errors
          const response = await sendUserToHubspot({
            email: user.email, // Use email from the authenticated user object
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            jobTitle: profileData.job_title,
            schoolName: profileData.school_name,
            schoolAddress: profileData.school_address
          }, '5418', knownHubspotId);
          
          console.log('Hubspot API response:', response);
          console.log('User successfully added to Hubspot list 5418 after creating survey');
        } catch (hubspotError) {
          console.error('Failed to add user to Hubspot list:', hubspotError);
          // Don't fail the survey creation if Hubspot integration fails
        }
      } else {
        console.log('No complete profile data or email available to send to Hubspot');
      }

      toast.success("Survey created successfully!", {
        description: "Your survey has been saved. You can now preview or send it."
      });
      
      // Navigate after everything is done
      console.log('Navigating to edit page for survey:', savedSurvey.id);
      navigate(`/surveys/${savedSurvey.id}/edit`);
      
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error("Failed to create survey", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewSurvey = async () => {
    if (savedSurveyId) {
      window.open(`/survey?id=${savedSurveyId}&preview=true`, '_blank');
    } else {
      toast.info("Saving survey before preview", {
        description: "The survey will be saved first, then opened in preview mode."
      });
      
      // Form will trigger save first, then preview will happen after we have an ID
      document.querySelector('form button[type="submit"]')?.click();
    }
  };

  const handleSendSurvey = async () => {
    if (savedSurveyId) {
      await sendSurvey(savedSurveyId);
    } else {
      toast.info("Saving survey before sending", {
        description: "The survey will be saved first, then you'll be able to send it."
      });
      
      // Form will trigger save first, then send will happen after we have an ID
      document.querySelector('form button[type="submit"]')?.click();
    }
  };
  
  const sendSurvey = async (id: string) => {
    try {
      setIsSubmitting(true);
      
      // Get survey data including email recipients
      const { data: survey, error: surveyError } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('id', id)
        .single();
        
      if (surveyError) {
        throw surveyError;
      }
      
      if (!survey.emails || survey.emails.trim() === '') {
        // No email recipients, show the survey link
        toast.info("No email recipients specified", {
          description: "Use the survey link below to share with participants."
        });
        
        const baseUrl = window.location.origin;
        const surveyUrl = `${baseUrl}/survey?id=${id}`;
        
        // Update status to Sent
        await supabase
          .from('survey_templates')
          .update({ status: 'Sent' })
          .eq('id', id);
        
        navigate(`/surveys/${id}/edit`, { state: { showLink: true } });
        return;
      }
      
      // Has email recipients, send the survey
      const emailList = survey.emails
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email !== '');
        
      if (emailList.length === 0) {
        toast.info("No valid email recipients found", {
          description: "Use the survey link to share with participants."
        });
        
        // Update status to Sent
        await supabase
          .from('survey_templates')
          .update({ status: 'Sent' })
          .eq('id', id);
          
        navigate(`/surveys/${id}/edit`, { state: { showLink: true } });
        return;
      }
      
      // Call the edge function to send emails
      const surveyUrl = `${window.location.origin}/survey?id=${id}`;
      const { data, error } = await supabase.functions.invoke('send-survey-email', {
        body: { 
          surveyId: id,
          surveyName: survey.name,
          emails: emailList,
          surveyUrl: surveyUrl,
          isReminder: false
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update status to Sent
      await supabase
        .from('survey_templates')
        .update({ status: 'Sent' })
        .eq('id', id);
      
      console.log('Email sending results:', data);
      
      toast.success("Survey sent successfully!", {
        description: `Sent to ${data.count} recipients.`
      });
      
      navigate(`/surveys/${id}/edit`);
    } catch (error) {
      console.error('Error sending survey:', error);
      toast.error("Failed to send survey", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <SurveyLoading />;
  }

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
          submitButtonText="Save Survey"
          isEdit={false}
          isSubmitting={isSubmitting}
          initialCustomQuestionIds={[]}
          surveyId={savedSurveyId}
          onPreviewSurvey={handlePreviewSurvey}
          onSendSurvey={handleSendSurvey}
        />
      </div>
    </MainLayout>
  );
};

export default NewSurvey;
