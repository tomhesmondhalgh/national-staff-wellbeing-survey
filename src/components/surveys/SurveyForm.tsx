
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import SurveyFormInputs from './SurveyFormInputs';
import { Form } from '../ui/form';
import SurveyLink from './SurveyLink';
import { InfoIcon } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CustomQuestionsSelect from './CustomQuestionsSelect';
import { useNavigate } from 'react-router-dom';

// Form schema
const surveyFormSchema = z.object({
  name: z.string().min(3, { message: 'Survey name must be at least 3 characters' }),
  date: z.date({
    required_error: 'Survey date is required',
  }),
  closeDate: z.date().optional(),
  recipients: z.string().optional(),
  status: z.enum(['Saved', 'Scheduled', 'Sent', 'Completed']).optional(),
  distributionMethod: z.enum(['link', 'email']).default('link')
});

export type SurveyFormData = z.infer<typeof surveyFormSchema>;

interface SurveyFormProps {
  initialData?: Partial<SurveyFormData>;
  onSubmit: (data: SurveyFormData, customQuestionIds: string[]) => void;
  submitButtonText?: string;
  isEdit?: boolean;
  surveyId?: string | null;
  isSubmitting?: boolean;
  initialCustomQuestionIds?: string[];
  onPreviewSurvey?: () => void;
  onSendSurvey?: () => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ 
  initialData, 
  onSubmit, 
  submitButtonText = 'Save Changes',
  isEdit = false,
  surveyId,
  isSubmitting = false,
  initialCustomQuestionIds = [],
  onPreviewSurvey,
  onSendSurvey
}) => {
  const [showSurveyLink, setShowSurveyLink] = useState<boolean>(false);
  const [surveyLink, setSurveyLink] = useState<string>('');
  const [selectedCustomQuestionIds, setSelectedCustomQuestionIds] = useState<string[]>(initialCustomQuestionIds);
  const navigate = useNavigate();
  
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      closeDate: initialData?.closeDate ? new Date(initialData.closeDate) : undefined,
      recipients: initialData?.recipients || '',
      status: initialData?.status || 'Saved',
      distributionMethod: initialData?.distributionMethod || 'link'
    }
  });
  
  React.useEffect(() => {
    if (showSurveyLink && surveyId) {
      const baseUrl = window.location.origin;
      setSurveyLink(`${baseUrl}/survey?id=${surveyId}`);
    }
  }, [showSurveyLink, surveyId]);
  
  const handleFormSubmit = (data: SurveyFormData) => {
    onSubmit(data, selectedCustomQuestionIds || []);
    
    if (isEdit && surveyId) {
      setShowSurveyLink(true);
    }
  };

  const handlePreviewClick = () => {
    if (onPreviewSurvey) {
      onPreviewSurvey();
    }
  };
  
  const handleSendSurvey = () => {
    if (onSendSurvey) {
      onSendSurvey();
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          <SurveyFormInputs form={form} />
          
          {/* Custom Questions Select */}
          <CustomQuestionsSelect
            selectedQuestionIds={selectedCustomQuestionIds || []}
            onChange={setSelectedCustomQuestionIds}
          />
          
          <div className="mt-8 flex flex-wrap gap-4 justify-end">
            <Button 
              type="submit" 
              variant="outline"
              className="px-8" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : submitButtonText}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="px-6" 
              onClick={handlePreviewClick}
              disabled={isSubmitting}
            >
              Save and Preview
            </Button>
            
            <Button 
              type="button" 
              variant="default" 
              className="px-6" 
              onClick={handleSendSurvey}
              disabled={isSubmitting}
            >
              Save and Send
            </Button>
          </div>
        </form>
      </Form>
      
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
