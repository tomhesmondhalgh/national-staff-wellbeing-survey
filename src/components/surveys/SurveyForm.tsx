
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { SurveyFormInputs } from './SurveyFormInputs';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SurveyLink } from './SurveyLink';

// Form schema
const surveyFormSchema = z.object({
  name: z.string().min(3, { message: 'Survey name must be at least 3 characters' }),
  date: z.date({
    required_error: 'Survey date is required',
  }),
  closeDate: z.date().optional(),
  recipients: z.string().optional()
});

export type SurveyFormData = z.infer<typeof surveyFormSchema>;

interface SurveyFormProps {
  initialData?: Partial<SurveyFormData>;
  onSubmit: (data: SurveyFormData) => void;
  submitButtonText?: string;
  isEdit?: boolean;
  surveyId?: string;
  isSubmitting?: boolean;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ 
  initialData, 
  onSubmit, 
  submitButtonText = 'Save Changes',
  isEdit = false,
  surveyId,
  isSubmitting = false
}) => {
  const [showSurveyLink, setShowSurveyLink] = useState<boolean>(false);
  const [surveyLink, setSurveyLink] = useState<string>('');
  
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      closeDate: initialData?.closeDate ? new Date(initialData.closeDate) : undefined,
      recipients: initialData?.recipients || ''
    }
  });
  
  // If we're showing the survey link, generate the link when needed
  useEffect(() => {
    if (showSurveyLink && surveyId) {
      const baseUrl = window.location.origin;
      setSurveyLink(`${baseUrl}/survey?id=${surveyId}`);
    }
  }, [showSurveyLink, surveyId]);
  
  const handleFormSubmit = (data: SurveyFormData) => {
    onSubmit(data);
    
    if (isEdit && surveyId) {
      setShowSurveyLink(true);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <SurveyFormInputs form={form} />
        
        <div className={`mt-8 ${isEdit ? 'flex justify-between' : 'text-center'}`}>
          <Button 
            type="submit" 
            className="px-8" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : submitButtonText}
          </Button>
        </div>
      </form>
      
      {showSurveyLink && surveyLink && (
        <div className="border border-gray-200 rounded-md p-6 bg-gray-50 mt-8">
          <h3 className="text-lg font-medium mb-4">Your Survey Link</h3>
          <SurveyLink surveyUrl={surveyLink} />
        </div>
      )}
    </div>
  );
};

export default SurveyForm;
