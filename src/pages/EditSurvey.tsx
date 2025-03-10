
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { supabase } from '../lib/supabase';
import PageTitle from '../components/ui/PageTitle';
import { toast } from "sonner";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

const EditSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [surveyData, setSurveyData] = useState<SurveyFormData | null>(null);
  const [customQuestionIds, setCustomQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        if (!id) return;
        
        // Fetch survey data
        const { data, error } = await supabase
          .from('survey_templates')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (!data) {
          toast.error("Survey not found");
          navigate('/surveys');
          return;
        }
        
        // Transform data for form
        setSurveyData({
          name: data.name,
          date: new Date(data.date),
          closeDate: data.close_date ? new Date(data.close_date) : undefined,
          recipients: data.emails || ''
        });
        
        // Fetch any custom questions linked to this survey
        const { data: linkData, error: linkError } = await supabase
          .from('survey_custom_questions')
          .select('question_id')
          .eq('survey_id', id);
          
        if (!linkError && linkData) {
          setCustomQuestionIds(linkData.map(item => item.question_id));
        }
        
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast.error("Error loading survey", {
          description: "Could not load the survey data. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id, navigate]);

  const handleSubmit = async (data: SurveyFormData, selectedCustomQuestionIds: string[]) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      // Format date properly for Supabase
      const updateDate = new Date(data.date);
      const updateCloseDate = data.closeDate ? new Date(data.closeDate) : null;
      
      // Update survey template in Supabase
      const { error } = await supabase
        .from('survey_templates')
        .update({
          name: data.name,
          date: updateDate.toISOString(),
          close_date: updateCloseDate ? updateCloseDate.toISOString() : null,
          emails: data.recipients,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Handle custom questions - first remove existing links
      const { error: deleteError } = await supabase
        .from('survey_custom_questions')
        .delete()
        .eq('survey_id', id);
        
      if (deleteError) {
        console.error('Error removing existing custom question links:', deleteError);
      }
      
      // Add new links for selected custom questions
      if (selectedCustomQuestionIds.length > 0) {
        const surveyQuestionLinks = selectedCustomQuestionIds.map(questionId => ({
          survey_id: id,
          question_id: questionId
        }));
        
        const { error: insertError } = await supabase
          .from('survey_custom_questions')
          .insert(surveyQuestionLinks);
          
        if (insertError) {
          console.error('Error linking custom questions:', insertError);
        }
      }
      
      // Success message
      toast.success("Survey updated successfully", {
        description: "Your changes have been saved."
      });
      
    } catch (error) {
      console.error('Error updating survey:', error);
      toast.error("Failed to update survey", {
        description: "There was a problem saving your changes."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSurvey = async () => {
    if (!id || !surveyData) return;
    
    setIsSending(true);
    
    try {
      // Get the survey data first to confirm recipients
      const { data: survey, error: surveyError } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('id', id)
        .single();
      
      if (surveyError) throw surveyError;
      
      if (!survey) {
        toast.error("Survey not found");
        return;
      }
      
      // Check if there are recipients
      if (!survey.emails || survey.emails.trim() === '') {
        toast.error("No recipients specified", {
          description: "Please add email recipients before sending the survey."
        });
        return;
      }
      
      // Generate survey link
      const baseUrl = window.location.origin;
      const surveyUrl = `${baseUrl}/survey?id=${id}`;
      
      // Process email addresses: trim spaces, split by commas
      const emails = survey.emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
      if (emails.length === 0) {
        toast.error("No valid email addresses found", {
          description: "Please check the email addresses you've entered."
        });
        return;
      }
      
      // Call the Edge Function to send emails
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-survey-email', {
        body: {
          surveyId: id,
          surveyName: survey.name,
          emails: emails,
          surveyUrl: surveyUrl,
          isReminder: false
        }
      });
      
      if (emailError) {
        throw emailError;
      }
      
      toast.success("Survey invitations sent", {
        description: `Invitations sent to ${emails.length} recipients.`
      });
      
    } catch (error) {
      console.error('Error sending survey invitations:', error);
      toast.error("Failed to send survey invitations", {
        description: "There was a problem sending the invitations. Please try again."
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p>Loading survey data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!surveyData) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <p className="text-red-500">Survey not found or you don't have permission to edit it.</p>
            <button 
              onClick={() => navigate('/surveys')}
              className="mt-4 px-4 py-2 bg-brand-blue text-white rounded hover:bg-blue-600"
            >
              Back to Surveys
            </button>
          </div>
        </div>
      </MainLayout>
    );
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
              <BreadcrumbPage>Edit Survey</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title="Edit Survey" 
          subtitle="Make changes to your wellbeing survey"
        />
        
        <SurveyForm 
          initialData={surveyData} 
          onSubmit={handleSubmit} 
          submitButtonText="Save Changes"
          isEdit={true}
          surveyId={id}
          isSubmitting={isSubmitting}
          initialCustomQuestionIds={customQuestionIds}
          onSendSurvey={handleSendSurvey}
        />
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
