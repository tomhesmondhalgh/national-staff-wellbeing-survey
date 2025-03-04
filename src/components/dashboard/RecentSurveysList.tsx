
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { SurveyWithResponses } from '../../utils/surveyUtils';

interface RecentSurveysListProps {
  surveys: SurveyWithResponses[];
  isLoading: boolean;
}

const RecentSurveysList = ({ surveys, isLoading }: RecentSurveysListProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-6 animate-pulse">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <div className="h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="col-span-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="col-span-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="col-span-1">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="col-span-4 flex justify-end">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No surveys found. Create your first survey to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase">
        <div className="col-span-3">Survey</div>
        <div className="col-span-3">Date</div>
        <div className="col-span-3">Status</div>
        <div className="col-span-3">Responses</div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {surveys.map((survey) => (
          <div key={survey.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-gray-50 transition-colors">
            <div className="col-span-3">
              <div>
                <h3 className="text-gray-900 font-medium">
                  <Link 
                    to={`/analysis?surveyId=${survey.id}`}
                    className="hover:text-brandPurple-600 transition-colors"
                  >
                    {survey.name}
                  </Link>
                </h3>
                {survey.close_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Closes: {formatDate(survey.close_date)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="col-span-3 text-gray-700">
              {formatDate(survey.date)}
            </div>
            
            <div className="col-span-3">
              <span className={`
                inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                ${survey.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                  survey.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 
                  'bg-purple-100 text-purple-800'}
              `}>
                {survey.status}
              </span>
            </div>
            
            <div className="col-span-3 text-gray-700">
              {survey.responses}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSurveysList;
