
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { sendUserToHubspot } from '../utils/auth';
import ArchiveSurveyDialog from '../components/surveys/ArchiveSurveyDialog';

const SurveyEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [surveyData, setSurveyData] = useState<SurveyFormData | null>(null);
  const [customQuestionIds, setCustomQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [savedSurveyId, setSavedSurveyId] = useState<string | null>(id || null);
  
  const isEditMode = !!id;
  const knownHubspotId = "31923701";
  
  useEffect(() => {
    if (!user) {
      setIsLoading(true);
      const checkUser = setTimeout(() => {
        if (!user) {
          toast.error("Authentication required", {
            description: "You must be logged in to create or edit a survey."
          });
          navigate('/login');
        }
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(checkUser);
    }
    
    if (isEditMode) {
      fetchSurvey(id);
    } else {
      setIsLoading(false);
    }
  }, [user, id, navigate, isEditMode]);

  const fetchSurvey = async (surveyId: string) => {
    try {
      console.log('Fetching survey with ID:', surveyId);
      
      const { data, error } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('id', surveyId)
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
      const distributionMethod = hasEmails ? 'email' : 'link';
      
      console.log('Distribution method determined:', distributionMethod);
      console.log('Email data found:', data.emails);
      
      setSurveyData({
        name: data.name,
        date: new Date(data.date),
        closeDate: data.close_date ? new Date(data.close_date) : undefined,
        recipients: data.emails || '',
        status: data.status || 'Saved',
        distributionMethod: distributionMethod
      });
      
      const { data: linkData, error: linkError } = await supabase
        .from('survey_questions')
        .select('question_id')
        .eq('survey_id', surveyId);
        
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

  const handleSubmit = async (data: SurveyFormData, selectedCustomQuestionIds: string[]) => {
    try {
      setIsSubmitting(true);
      console.log('Survey data to be saved:', data);
      console.log('Custom question IDs:', selectedCustomQuestionIds);
      
      if (!user) {
        toast.error("Authentication required", {
          description: "You must be logged in to create a survey."
        });
        navigate('/login');
        return;
      }

      const surveyDate = new Date(data.date);
      const closeDate = data.closeDate ? new Date(data.closeDate) : null;
      
      // Determine the emails value based on the distribution method
      const emailsValue = data.distributionMethod === 'email' ? data.recipients : '';
      
      if (isEditMode && savedSurveyId) {
        // Update existing survey
        console.log('Updating survey with status:', data.status || 'Saved');
        
        const { error } = await supabase
          .from('survey_templates')
          .update({
            name: data.name,
            date: surveyDate.toISOString(),
            close_date: closeDate ? closeDate.toISOString() : null,
            emails: emailsValue,
            status: data.status || 'Saved',
            updated_at: new Date().toISOString()
          })
          .eq('id', savedSurveyId);
        
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
          .eq('survey_id', savedSurveyId);
          
        if (deleteError) {
          console.error('Error removing existing custom question links:', deleteError);
        }
      } else {
        // Create new survey
        console.log('Creating survey with status:', data.status || 'Saved');
        
        const { data: savedSurvey, error } = await supabase
          .from('survey_templates')
          .insert({
            name: data.name,
            date: surveyDate.toISOString(),
            close_date: closeDate ? closeDate.toISOString() : null,
            creator_id: user.id,
            emails: emailsValue,
            status: data.status || 'Saved'
          })
          .select()
          .single();
        
        if (error) {
          console.error('Supabase error saving survey:', error);
          if (error.message.includes('connection')) {
            throw new Error('Failed to connect to the server. Please check your connection and try again.');
          }
          throw error;
        }
        
        console.log('Saved survey:', savedSurvey);
        setSavedSurveyId(savedSurvey.id);
        
        // Add to Hubspot list for new surveys
        console.log('Fetching user profile data for Hubspot integration...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, job_title, school_name, school_address')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile data:', profileError);
        } else if (profileData && user.email) {
          console.log('Attempting to send user data to Hubspot list 5418...');
          try {
            const response = await sendUserToHubspot({
              email: user.email,
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
          }
        }
      }
      
      // Link custom questions
      if (selectedCustomQuestionIds.length > 0 && savedSurveyId) {
        const surveyQuestionLinks = selectedCustomQuestionIds.map(questionId => ({
          survey_id: savedSurveyId,
          question_id: questionId
        }));
        
        const { error: linkError } = await supabase
          .from('survey_questions')
          .insert(surveyQuestionLinks);
          
        if (linkError) {
          console.error('Error linking custom questions:', linkError);
        }
      }
      
      // Update local state with the saved data
      setSurveyData({
        ...data,
        recipients: emailsValue
      });
      
      // Display success message
      const successMessage = isEditMode ? "Survey updated successfully" : "Survey created successfully!";
      const successDescription = isEditMode ? "Your changes have been saved." : "Your survey has been saved. You can now preview or send it.";
      
      toast.success(successMessage, {
        description: successDescription
      });
      
      // Redirect to edit page for new surveys
      if (!isEditMode && savedSurveyId) {
        navigate(`/surveys/${savedSurveyId}/edit`);
      }
      
      return savedSurveyId;
      
    } catch (error) {
      console.error('Error saving survey:', error);
      const errorMessage = error instanceof Error ? error.message : "Please check your connection and try again.";
      toast.error("Failed to save survey", {
        description: errorMessage
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewSurvey = async () => {
    try {
      // If survey is already saved, open preview directly
      if (savedSurveyId) {
        window.open(`/survey?id=${savedSurveyId}&preview=true`, '_blank');
        return;
      }
      
      // Need to save the survey first
      toast.info("Saving survey before preview", {
        description: "The survey will be saved first, then opened in preview mode."
      });
      
      // Save form and get survey ID
      const formData = surveyData || {
        name: '',
        date: new Date(),
        distributionMethod: 'link'
      };
      
      const newSurveyId = await handleSubmit(formData, customQuestionIds);
      
      // Open preview if save was successful
      if (newSurveyId) {
        window.open(`/survey?id=${newSurveyId}&preview=true`, '_blank');
      }
    } catch (error) {
      console.error('Error handling preview:', error);
      toast.error("Failed to preview survey", {
        description: "Please try again."
      });
    }
  };

  const handleSendSurvey = async () => {
    try {
      setIsSubmitting(true);
      
      // Save the survey first if needed
      let surveyToSend = savedSurveyId;
      
      if (!surveyToSend) {
        const formData = surveyData || {
          name: '',
          date: new Date(),
          distributionMethod: 'link'
        };
        
        surveyToSend = await handleSubmit(formData, customQuestionIds);
        
        if (!surveyToSend) {
          toast.error("Failed to save survey", {
            description: "Unable to send the survey. Please try again."
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Get latest survey data
      const { data: survey, error: surveyError } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('id', surveyToSend)
        .single();
      
      if (surveyError || !survey) {
        console.error('Error fetching survey for sending:', surveyError);
        throw surveyError || new Error("Survey not found");
      }
      
      const baseUrl = window.location.origin;
      const surveyUrl = `${baseUrl}/survey?id=${surveyToSend}`;
      
      const currentDistMethod = surveyData?.distributionMethod || 'link';
      
      // Handle link distribution
      if (currentDistMethod === 'link' || !survey.emails || survey.emails.trim() === '') {
        await supabase
          .from('survey_templates')
          .update({ status: 'Sent' })
          .eq('id', surveyToSend);
        
        toast.success("Survey ready to share", {
          description: "Use the survey link to share with participants."
        });
        
        navigate('/surveys');
        return;
      }
      
      // Handle email distribution
      const emailList = survey.emails
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
      if (emailList.length === 0) {
        toast.info("No valid email recipients found", {
          description: "Use the survey link to share with participants."
        });
        
        await supabase
          .from('survey_templates')
          .update({ status: 'Sent' })
          .eq('id', surveyToSend);
          
        navigate('/surveys');
        return;
      }
      
      // Send emails
      const { data, error } = await supabase.functions.invoke('send-survey-email', {
        body: { 
          surveyId: surveyToSend,
          surveyName: survey.name,
          emails: emailList,
          surveyUrl: surveyUrl,
          isReminder: false
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update survey status to sent
      await supabase
        .from('survey_templates')
        .update({ status: 'Sent' })
        .eq('id', surveyToSend);
      
      toast.success("Survey sent successfully!", {
        description: `Sent to ${data?.count || emailList.length} recipients.`
      });
      
      navigate('/surveys');
    } catch (error) {
      console.error('Error sending survey:', error);
      toast.error("Failed to send survey", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSurvey = async () => {
    if (!savedSurveyId) return;
    
    try {
      const { error } = await supabase
        .from('survey_templates')
        .update({
          status: 'Archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', savedSurveyId);
      
      if (error) {
        console.error('Error archiving survey:', error);
        throw error;
      }
      
      toast.success("Survey archived successfully", {
        description: "The survey has been moved to the archive."
      });
      
      navigate('/surveys');
    } catch (error) {
      console.error('Error archiving survey:', error);
      toast.error("Failed to archive survey", {
        description: "There was a problem archiving the survey. Please try again."
      });
    }
  };

  if (isLoading) {
    return <SurveyLoading />;
  }

  // Show error state if survey not found in edit mode
  if (isEditMode && !surveyData) {
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
              <BreadcrumbPage>{isEditMode ? 'Edit Survey' : 'Create New Survey'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title={isEditMode ? "Edit Survey" : "Create New Survey"} 
          subtitle={isEditMode ? "Make changes to your wellbeing survey" : "Set up a new wellbeing survey to send to your staff"}
        />
        
        <SurveyForm 
          initialData={surveyData || undefined} 
          onSubmit={handleSubmit} 
          submitButtonText={isEditMode ? "Save Changes" : "Save"}
          isEdit={isEditMode}
          surveyId={savedSurveyId}
          isSubmitting={isSubmitting}
          initialCustomQuestionIds={customQuestionIds}
          onPreviewSurvey={handlePreviewSurvey}
          onSendSurvey={handleSendSurvey}
        />

        {isEditMode && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsArchiveDialogOpen(true)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Archive Survey
            </button>
          </div>
        )}

        <ArchiveSurveyDialog
          isOpen={isArchiveDialogOpen}
          onClose={() => setIsArchiveDialogOpen(false)}
          onConfirm={handleArchiveSurvey}
          surveyName={surveyData?.name || ""}
        />
      </div>
    </MainLayout>
  );
};

export default SurveyEditor;
