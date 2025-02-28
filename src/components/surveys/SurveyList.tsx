
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Send } from 'lucide-react';

interface Survey {
  id: string;
  name: string;
  date: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  responseCount: number;
  closeDate?: string;
  url?: string;
}

interface SurveyListProps {
  surveys: Survey[];
  onSendReminder: (id: string) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys, onSendReminder }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Toast notification is handled by the parent component
  };

  if (surveys.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 mb-4">No surveys found</p>
        <Link to="/new-survey" className="btn-primary inline-block">
          Create Your First Survey
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="divide-y divide-gray-100">
        {surveys.map((survey) => (
          <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex flex-wrap justify-between items-start">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{survey.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock size={16} className="mr-1" />
                  <span>Sent: {survey.date}</span>
                  {survey.closeDate && (
                    <span className="ml-4">Closes: {survey.closeDate}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2
                    ${survey.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                      survey.status === 'Sent' ? 'bg-green-100 text-green-800' : 
                      'bg-purple-100 text-purple-800'}
                  `}>
                    {survey.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {survey.responseCount} {survey.responseCount === 1 ? 'response' : 'responses'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {survey.status === 'Sent' && (
                  <button 
                    onClick={() => onSendReminder(survey.id)}
                    className="btn-outline btn-sm flex items-center"
                  >
                    <Send size={14} className="mr-1" />
                    Send Reminder
                  </button>
                )}
                
                {survey.url && (
                  <button 
                    onClick={() => copyToClipboard(survey.url!)}
                    className="btn-outline btn-sm"
                  >
                    Copy Link
                  </button>
                )}
                
                <Link 
                  to={`/surveys/${survey.id}/edit`} 
                  className="btn-ghost btn-sm"
                >
                  Edit
                </Link>
                
                <Link 
                  to={`/analysis?surveyId=${survey.id}`}
                  className="btn-primary btn-sm"
                >
                  View Results
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyList;
