
import React from 'react';

const SurveyListHeader: React.FC = () => {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase">
      <div className="col-span-3">Survey</div>
      <div className="col-span-2">Date</div>
      <div className="col-span-2">Status</div>
      <div className="col-span-1">Responses</div>
      <div className="col-span-4 text-right">Actions</div>
    </div>
  );
};

export default SurveyListHeader;
