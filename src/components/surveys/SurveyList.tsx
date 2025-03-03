
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SurveyListHeader from './SurveyListHeader';
import SurveyListItem from './SurveyListItem';

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
  const navigate = useNavigate();

  const handleEditClick = (id: string) => {
    navigate(`/surveys/${id}/edit`);
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
      <SurveyListHeader />
      
      <div className="divide-y divide-gray-100">
        {surveys.map((survey) => (
          <SurveyListItem
            key={survey.id}
            survey={survey}
            onEditClick={handleEditClick}
            copiedId={copiedId}
            setCopiedId={setCopiedId}
            sendingReminder={sendingReminder}
            setSendingReminder={setSendingReminder}
            onSendReminder={onSendReminder}
          />
        ))}
      </div>
    </div>
  );
};

export default SurveyList;
