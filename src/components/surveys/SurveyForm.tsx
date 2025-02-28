
import React, { useState } from 'react';
import { Calendar, Copy, Check, Mail } from 'lucide-react';

interface SurveyFormProps {
  onSubmit: (data: SurveyFormData) => void;
  initialData?: Partial<SurveyFormData>;
}

export interface SurveyFormData {
  date: string;
  closeDate: string;
  emails: string;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<SurveyFormData>({
    date: initialData?.date || '',
    closeDate: initialData?.closeDate || '',
    emails: initialData?.emails || ''
  });
  
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // In a real application, the URL would be returned from the backend
    // Here we're just generating a fake URL for demonstration
    setSurveyUrl(`https://wellbeingsurvey.com/${Math.random().toString(36).substring(2, 10)}`);
  };
  
  const handleCopyUrl = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card p-6 animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter staff email addresses, separated by commas. Leave blank to use the survey link instead.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            {surveyUrl ? 'Update Survey' : 'Create Survey'}
          </button>
        </div>
      </form>
      
      {surveyUrl && (
        <div className="mt-8 p-4 border border-brandPurple-200 rounded-md bg-brandPurple-50 animate-slide-up">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Survey Link</h3>
          <div className="flex items-center">
            <input
              type="text"
              readOnly
              value={surveyUrl}
              className="form-input flex-grow text-sm"
            />
            <button 
              onClick={handleCopyUrl}
              className="ml-2 btn-secondary flex items-center"
            >
              {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Share this unique link with your staff. The link will be active until the close date.
          </p>
        </div>
      )}
    </div>
  );
};

export default SurveyForm;
