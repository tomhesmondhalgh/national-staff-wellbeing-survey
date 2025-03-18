
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

/**
 * Sends a reminder email to all recipients for a specific survey
 * @param surveyId The ID of the survey to send reminders for
 * @returns A promise that resolves when the reminder has been sent
 */
export const sendSurveyReminder = async (surveyId: string): Promise<boolean> => {
  try {
    console.log('Sending reminder for survey:', surveyId);
    
    // Get survey details including recipients
    const { data: survey, error: surveyError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('id', surveyId)
      .maybeSingle();
      
    if (surveyError) {
      console.error('Error fetching survey for reminder:', surveyError);
      throw surveyError;
    }
    
    if (!survey) {
      toast.error("Survey not found");
      return false;
    }
    
    // Check if there are email addresses to send reminders to
    if (!survey.emails || survey.emails.trim() === '') {
      toast.error("No email addresses found for this survey", {
        description: "Add email addresses in the survey settings to send reminders."
      });
      return false;
    }
    
    const emails = survey.emails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (emails.length === 0) {
      toast.error("No valid email addresses found", {
        description: "Please check the email addresses in the survey settings."
      });
      return false;
    }
    
    const baseUrl = window.location.origin;
    const surveyUrl = `${baseUrl}/survey?id=${surveyId}`;
    
    // Call the email function
    const { data, error } = await supabase.functions.invoke('send-survey-email', {
      body: {
        surveyId: surveyId,
        surveyName: survey.name,
        emails: emails,
        surveyUrl: surveyUrl,
        isReminder: true
      }
    });
    
    if (error) {
      console.error('Error sending reminder emails:', error);
      throw error;
    }
    
    console.log('Reminder sent successfully:', data);
    return true;
    
  } catch (error) {
    console.error('Failed to send reminder:', error);
    toast.error("Failed to send reminder", {
      description: "There was a problem sending the reminder. Please try again."
    });
    return false;
  }
};
