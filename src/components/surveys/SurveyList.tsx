
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Copy, Edit } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

interface Survey {
  id: string;
  name: string;
  date: string;
  formattedDate: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  responseCount: number;
  closeDate?: string;
  closeDisplayDate?: string;
  url?: string;
  emails?: string;
}

interface SurveyListProps {
  surveys: Survey[];
  onSendReminder: (id: string) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys, onSendReminder }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [canEditSurveys, setCanEditSurveys] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = usePermissions();

  useEffect(() => {
    const checkEditPermission = async () => {
      if (permissions && !permissions.isLoading) {
        const canEdit = await permissions.canEdit();
        setCanEditSurveys(canEdit);
      }
    };
    
    checkEditPermission();
  }, [permissions]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(id);
        toast.success("Survey link copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  const handleEditClick = (id: string) => {
    if (!canEditSurveys) {
      toast.error("You don't have permission to edit surveys");
      return;
    }
    
    // Log before navigation to help debug
    console.log(`Navigating to edit survey: ${id}`);
    navigate(`/surveys/${id}/edit`);
  };
  
  const handleSendReminder = async (survey: Survey) => {
    if (!canEditSurveys) {
      toast.error("You don't have permission to send reminders");
      return;
    }
    
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

  if (surveys.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 text-center py-12">
        <p className="text-gray-500 mb-4">No surveys found</p>
        {canEditSurveys && (
          <Link to="/new-survey" className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white font-medium py-2 px-6 rounded-md transition-all duration-200 inline-block">
            Create Your First Survey
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">      
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase">
        <div className="col-span-3">Survey</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Responses</div>
        <div className="col-span-4 text-right">Actions</div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {surveys.map((survey) => (
          <div key={survey.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50 transition-colors">
            <div className="col-span-3">
              <div>
                <h3 className="text-gray-900 font-medium">
                  {canEditSurveys ? (
                    <button 
                      onClick={() => handleEditClick(survey.id)}
                      className="hover:text-brandPurple-600 transition-colors text-left"
                    >
                      {survey.name}
                    </button>
                  ) : (
                    <span>{survey.name}</span>
                  )}
                </h3>
                {survey.closeDisplayDate && (
                  <p className="text-xs text-gray-500 mt-1">{survey.closeDisplayDate}</p>
                )}
              </div>
            </div>
            
            <div className="col-span-2 text-gray-700">
              {survey.formattedDate}
            </div>
            
            <div className="col-span-2">
              <span className={`
                inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                ${survey.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                  survey.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 
                  'bg-purple-100 text-purple-800'}
              `}>
                {survey.status}
              </span>
            </div>
            
            <div className="col-span-1 text-gray-700">
              {survey.responseCount}
            </div>
            
            <div className="col-span-4 flex justify-end space-x-4">
              {survey.status === 'Sent' && canEditSurveys && (
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
              
              {survey.url && (
                <button 
                  onClick={() => copyToClipboard(survey.id, survey.url!)}
                  className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
                  title="Copy survey link to clipboard"
                >
                  <Copy size={16} className="mr-1" />
                  <span>{copiedId === survey.id ? 'Copied!' : 'Copy Link'}</span>
                </button>
              )}
              
              {canEditSurveys && (
                <button 
                  onClick={() => handleEditClick(survey.id)}
                  className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
                  title="Edit survey details"
                >
                  <Edit size={16} className="mr-1" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyList;
