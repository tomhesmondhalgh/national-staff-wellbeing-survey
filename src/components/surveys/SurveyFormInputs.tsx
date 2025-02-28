
import React from 'react';
import { Calendar, Mail } from 'lucide-react';
import { SurveyFormData } from './SurveyForm';

interface SurveyFormInputsProps {
  formData: SurveyFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isSubmitting: boolean;
}

const SurveyFormInputs: React.FC<SurveyFormInputsProps> = ({ 
  formData, 
  handleChange, 
  isSubmitting 
}) => {
  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Survey Name*
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="form-input w-full"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Spring Term 2024 Survey"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          A descriptive name to help you identify this survey
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Survey Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="form-input pl-10 w-full"
              value={formData.date}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            The date when the survey will be sent to staff
          </p>
        </div>
        
        <div>
          <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700 mb-1">
            Close Date*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              id="closeDate"
              name="closeDate"
              type="date"
              required
              className="form-input pl-10 w-full"
              value={formData.closeDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            The last day staff can respond to the survey
          </p>
        </div>
      </div>
      
      <div>
        <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
          Send to Specific Email Addresses
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail size={16} className="text-gray-400" />
          </div>
          <textarea
            id="emails"
            name="emails"
            rows={4}
            className="form-input pl-10 w-full"
            placeholder="Enter email addresses, separated by commas"
            value={formData.emails}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Enter staff email addresses, separated by commas. Leave blank to use the survey link instead.
        </p>
      </div>
    </>
  );
};

export default SurveyFormInputs;
