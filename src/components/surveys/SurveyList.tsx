
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Copy, Edit } from 'lucide-react';
import { toast } from "sonner";

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
}

interface SurveyListProps {
  surveys: Survey[];
  onSendReminder: (id: string) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys, onSendReminder }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  if (surveys.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 text-center py-12">
        <p className="text-gray-500 mb-4">No surveys found</p>
        <Link to="/new-survey" className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white font-medium py-2 px-6 rounded-md transition-all duration-200 inline-block">
          Create Your First Survey
        </Link>
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
                <h3 className="text-gray-900 font-medium">{survey.name}</h3>
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
              {survey.status === 'Sent' && (
                <button 
                  onClick={() => onSendReminder(survey.id)}
                  className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
                  title="Send reminder to participants"
                >
                  <Send size={16} className="mr-1" />
                  <span>Remind</span>
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
              
              <Link 
                to={`/surveys/${survey.id}/edit`} 
                className="flex items-center text-sm text-gray-500 hover:text-brandPurple-600 transition-colors whitespace-nowrap"
                title="Edit survey details"
              >
                <Edit size={16} className="mr-1" />
                <span>Edit</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyList;
