import React from 'react';
import { Send, Copy, Edit } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '../../lib/supabase';

interface Survey {
  id: string;
  name: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  emails?: string;
  url?: string;
}

interface SurveyActionsProps {
  survey: Survey;
  onEditClick: (id: string) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  sendingReminder: string | null;
  setSendingReminder: (id: string | null) => void;
  onSendReminder: (id: string) => void;
}

const SurveyActions: React.FC<SurveyActionsProps> = ({
  survey,
  onEditClick,
  copiedId,
  setCopiedId,
  sendingReminder,
  setSendingReminder,
  onSendReminder
}) => {
  const copyToClipboard = async (surveyId: string) => {
    try {
      // Generate the public survey participation URL
      const surveyUrl = `${window.location.origin}/survey?id=${surveyId}`;
      
      console.log("Copying survey URL to clipboard:", surveyUrl);
      
      await navigator.clipboard.writeText(surveyUrl);
      setCopiedId(surveyId);
      toast.success("Survey link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy survey link:", error);
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleSendReminder = async (survey: Survey) => {
    if (!survey.emails || !survey.emails.trim()) {
      toast.error("No email recipients", {
        description: "This survey doesn't have any email recipients configured."
      });
      return;
    }
    
    try {
      setSendingReminder(survey.id);
      
      const emails = survey.emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
      if (emails.length === 0) {
        toast.error("No valid email addresses", {
          description: "Please check the email addresses and try again."
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('send-survey-email', {
        body: {
          surveyId: survey.id,
          surveyName: survey.name,
          emails,
          surveyUrl: survey.url,
          isReminder: true
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Reminder sending result:", data);
      
      if (data.success) {
        onSendReminder(survey.id);
        toast.success("Reminders sent successfully", {
          description: `Sent to ${data.count} recipients.`
        });
      } else {
        throw new Error(data.error || "Failed to send reminders");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders", {
        description: "There was a problem sending the reminders. Please try again."
      });
    } finally {
      setSendingReminder(null);
    }
  };

  return (
    <div className="col-span-4 flex justify-end space-x-4">
      {survey.status === 'Sent' && (
        <button 
          onClick={() => handleSendReminder(survey)}
          className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
          title="Send reminder to participants"
          disabled={sendingReminder === survey.id}
        >
          <Send size={16} className="mr-1" />
          <span>
            {sendingReminder === survey.id ? 'Sending...' : 'Remind'}
          </span>
        </button>
      )}
      
      <button 
        onClick={() => copyToClipboard(survey.id)}
        className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
        title="Copy survey link to clipboard"
      >
        <Copy size={16} className="mr-1" />
        <span>{copiedId === survey.id ? 'Copied!' : 'Copy Link'}</span>
      </button>
      
      <button 
        onClick={() => onEditClick(survey.id)}
        className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
        title="Edit survey details"
      >
        <Edit size={16} className="mr-1" />
        <span>Edit</span>
      </button>
    </div>
  );
};

export default SurveyActions;
