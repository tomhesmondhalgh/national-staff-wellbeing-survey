
import React from 'react';
import SurveyActions from './SurveyActions';

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

interface SurveyListItemProps {
  survey: Survey;
  onEditClick: (id: string) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  sendingReminder: string | null;
  setSendingReminder: (id: string | null) => void;
  onSendReminder: (id: string) => void;
}

const SurveyListItem: React.FC<SurveyListItemProps> = ({
  survey,
  onEditClick,
  copiedId,
  setCopiedId,
  sendingReminder,
  setSendingReminder,
  onSendReminder
}) => {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50 transition-colors">
      <div className="col-span-3">
        <div>
          <h3 className="text-gray-900 font-medium">
            <button 
              onClick={() => onEditClick(survey.id)}
              className="hover:text-brandPurple-600 transition-colors text-left"
            >
              {survey.name}
            </button>
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
      
      <SurveyActions 
        survey={survey}
        onEditClick={onEditClick}
        copiedId={copiedId}
        setCopiedId={setCopiedId}
        sendingReminder={sendingReminder}
        setSendingReminder={setSendingReminder}
        onSendReminder={onSendReminder}
      />
    </div>
  );
};

export default SurveyListItem;
