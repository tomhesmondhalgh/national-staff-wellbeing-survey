
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
        
        console.log('Fetching survey with ID:', id);
        
        const { data, error } = await supabase
          .from('survey_templates')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching survey:', error);
          throw error;
        }
        
        if (!data) {
          toast.error("Survey not found");
          navigate('/surveys');
          return;
        }
        
        console.log('Fetched survey data:', data);
        
        // Determine distribution method based on whether emails is set
        const hasEmails = data.emails && data.emails.trim() !== '';
        
        setSurveyData({
          name: data.name,
          date: new Date(data.date),
          closeDate: data.close_date ? new Date(data.close_date) : undefined,
          recipients: data.emails || '',
          status: data.status || 'Saved',
          distributionMethod: hasEmails ? 'email' : 'link'
        });
        
        const { data: linkData, error: linkError } = await supabase
          .from('survey_questions')
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
      const updateDate = new Date(data.date);
      const updateCloseDate = data.closeDate ? new Date(data.closeDate) : null;
      
      console.log('Updating survey with status:', data.status || 'Saved');
      console.log('Distribution method:', data.distributionMethod);
      console.log('Email recipients:', data.distributionMethod === 'email' ? data.recipients : 'None (using link)');
      
      const { error } = await supabase
        .from('survey_templates')
        .update({
          name: data.name,
          date: updateDate.toISOString(),
          close_date: updateCloseDate ? updateCloseDate.toISOString() : null,
          emails: data.distributionMethod === 'email' ? data.recipients : '',
          status: data.status || 'Saved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating survey:', error);
        if (error.message.includes('connection')) {
          throw new Error('Failed to connect to the server. Please check your connection and try again.');
        }
        throw error;
      }
      
      const { error: deleteError } = await supabase
        .from('survey_questions')
        .delete()
        .eq('survey_id', id);
        
      if (deleteError) {
        console.error('Error removing existing custom question links:', deleteError);
      }
      
      if (selectedCustomQuestionIds.length > 0) {
        const surveyQuestionLinks = selectedCustomQuestionIds.map(questionId => ({
          survey_id: id,
          question_id: questionId
        }));
        
        const { error: insertError } = await supabase
          .from('survey_questions')
          .insert(surveyQuestionLinks);
          
        if (insertError) {
          console.error('Error linking custom questions:', insertError);
        }
      }
      
      toast.success("Survey updated successfully", {
        description: "Your changes have been saved."
      });
      
    } catch (error) {
      console.error('Error updating survey:', error);
      const errorMessage = error instanceof Error ? error.message : "There was a problem saving your changes.";
      toast.error("Failed to update survey", {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewSurvey = () => {
    if (id) {
      window.open(`/survey?id=${id}&preview=true`, '_blank');
    } else {
      toast.error("Survey not found", {
        description: "Could not generate a preview link."
      });
    }
  };

  const handleSendSurvey = async () => {
    if (!id || !surveyData) return;
    
    setIsSending(true);
    
    try {
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
      
      const baseUrl = window.location.origin;
      const surveyUrl = `${baseUrl}/survey?id=${id}`;
      
      // Handle link distribution
      if (surveyData.distributionMethod === 'link' || !survey.emails || survey.emails.trim() === '') {
        await supabase
          .from('survey_templates')
          .update({ status: 'Sent' })
          .eq('id', id);
        
        toast.success("Survey ready to share", {
          description: "Use the survey link to share with participants."
        });
        
        navigate('/surveys');
        return;
      }
      
      // Handle email distribution
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
      
      // Update survey status to 'Sent'
      await supabase
        .from('survey_templates')
        .update({ status: 'Sent' })
        .eq('id', id);
      
      toast.success("Survey invitations sent", {
        description: `Invitations sent to ${emails.length} recipients.`
      });
      
      navigate('/surveys');
      
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
          onPreviewSurvey={handlePreviewSurvey}
          onSendSurvey={handleSendSurvey}
        />
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
