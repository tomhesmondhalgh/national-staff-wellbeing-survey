
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { format, parse, isBefore } from 'date-fns';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { useAuth } from '../contexts/AuthContext';

const EditSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<Partial<SurveyFormData> | null>(null);
  const [originalEmails, setOriginalEmails] = useState<string>('');
  const [originalCloseDate, setOriginalCloseDate] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('survey_templates')
          .select('name, date, close_date, emails')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching survey:', error);
          toast.error("Failed to load survey data", {
            description: "Please try again later."
          });
          navigate('/surveys');
          return;
        }
        
        if (!data) {
          toast.error("Survey not found", {
            description: "The survey you're trying to edit doesn't exist."
          });
          navigate('/surveys');
          return;
        }
        
        // Store the original emails for comparison later
        setOriginalEmails(data.emails || '');
        
        setSurveyData({
          name: data.name,
          date: new Date(data.date),
          closeDate: data.close_date ? new Date(data.close_date) : undefined,
          recipients: data.emails || ''
        });
      } catch (error) {
        console.error('Error:', error);
        toast.error("An error occurred", {
          description: "Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id, navigate]);

  const handleSubmit = async (data: SurveyFormData) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the survey in the database
      const { error } = await supabase
        .from('survey_templates')
        .update({
          name: data.name,
          date: data.date.toISOString(),
          close_date: data.closeDate ? data.closeDate.toISOString() : null,
          emails: data.recipients // Save recipients when updating
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating survey:', error);
        toast.error("Failed to update survey", {
          description: error.message
        });
        return;
      }

      // Check if email recipients have changed and send emails to new recipients
      if (data.recipients && data.recipients !== originalEmails) {
        // Generate survey link
        const baseUrl = window.location.origin;
        const surveyUrl = `${baseUrl}/survey?id=${id}`;
        
        // Find new email addresses that weren't in the original list
        const oldEmails = originalEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => email);
          
        const newEmails = data.recipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          .filter(email => !oldEmails.includes(email)); // Filter to only include emails not in old list
        
        if (newEmails.length > 0) {
          console.log('Sending surveys to new recipients:', newEmails);
          
          // Call the Edge Function to send emails only to new recipients
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-survey-email', {
            body: {
              surveyId: id,
              surveyName: data.name,
              emails: newEmails,
              surveyUrl: surveyUrl,
              isReminder: false
            }
          });
          
          if (emailError) {
            console.error('Error sending emails:', emailError);
            toast.error("Survey updated but emails could not be sent", {
              description: "Your survey was updated successfully, but there was an issue sending invitation emails to new recipients."
            });
          } else {
            console.log('Email sending result:', emailResult);
            toast.success("Survey updated and invitations sent", {
              description: `Survey updated and invitations sent to ${newEmails.length} new recipients.`
            });
          }
        } else {
          toast.success("Survey updated successfully!", {
            description: "Your changes have been saved. No new recipients to send to."
          });
        }
      } else {
        // Show success toast without email info
        toast.success("Survey updated successfully!", {
          description: "Your changes have been saved."
        });
      }
      
      // Navigate back to surveys list
      navigate('/surveys');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("An error occurred", {
        description: "Please try again later."
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
              <BreadcrumbPage>Edit Survey</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title="Edit Survey" 
          subtitle="Edit your existing staff wellbeing survey"
        />
        
        {isLoading ? (
          <div className="card p-6 animate-slide-up">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : surveyData ? (
          <SurveyForm 
            onSubmit={handleSubmit} 
            initialData={surveyData}
            submitButtonText="Update Survey"
            isEdit={true}
            isSubmitting={isSubmitting}
            surveyId={id}
          />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-gray-500">Survey not found or unable to load data.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
