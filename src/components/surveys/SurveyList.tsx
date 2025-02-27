
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Send, ExternalLink } from 'lucide-react';

interface Survey {
  id: number;
  name: string;
  date: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  responseCount: number;
  closeDate?: string;
  url?: string;
}

interface SurveyListProps {
  surveys: Survey[];
  onSendReminder: (id: number) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({ surveys, onSendReminder }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-amber-100 text-amber-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (surveys.length === 0) {
    return (
      <div className="text-center py-12 card animate-slide-up">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-xl font-medium text-gray-900">No surveys yet</h3>
        <p className="mt-1 text-gray-500">Get started by creating your first survey.</p>
        <div className="mt-6">
          <Link to="/new-survey" className="btn-primary">
            Create a survey
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Survey
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responses
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {surveys.map((survey) => (
              <tr key={survey.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{survey.name || `Survey ${survey.id}`}</div>
                  {survey.closeDate && (
                    <div className="text-xs text-gray-500">Closes: {survey.closeDate}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{survey.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}>
                    {survey.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {survey.responseCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <div className="flex justify-end gap-2">
                    {survey.status === 'Sent' && (
                      <button
                        onClick={() => onSendReminder(survey.id)}
                        className="btn-ghost py-1 px-2 flex items-center"
                        title="Send reminder"
                      >
                        <Send size={16} className="mr-1" />
                        <span>Remind</span>
                      </button>
                    )}
                    
                    {survey.url && (
                      <button className="btn-ghost py-1 px-2 flex items-center" title="Copy survey link">
                        <ExternalLink size={16} className="mr-1" />
                        <span>Copy link</span>
                      </button>
                    )}
                    
                    <Link
                      to={`/surveys/${survey.id}/edit`}
                      className="btn-ghost py-1 px-2 flex items-center"
                      title="Edit survey"
                    >
                      <Edit size={16} className="mr-1" />
                      <span>Edit</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SurveyList;
