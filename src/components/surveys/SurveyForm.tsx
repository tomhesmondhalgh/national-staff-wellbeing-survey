import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import SurveyFormInputs from './SurveyFormInputs';
import { Form } from '../ui/form';
import SurveyLink from './SurveyLink';
import { InfoIcon, Save, Play, Send } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CustomQuestionsSelect from './CustomQuestionsSelect';
import { useNavigate } from 'react-router-dom';
import { SurveyStatus } from '@/utils/types/survey';

// Form schema
const surveyFormSchema = z.object({
  name: z.string().min(3, { message: 'Survey name must be at least 3 characters' }),
  date: z.date({
    required_error: 'Survey date is required',
  }),
  closeDate: z.date().optional(),
  recipients: z.string().optional(),
  status: z.enum(['Saved', 'Scheduled', 'Sent', 'Completed', 'Archived']).optional(),
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
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (showSurveyLink && surveyId) {
      const baseUrl = window.location.origin;
      setSurveyLink(`${baseUrl}/survey?id=${surveyId}`);
    }
  }, [showSurveyLink, surveyId]);
  
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
  
  const handleFormSubmit = (data: SurveyFormData) => {
    onSubmit(data, selectedCustomQuestionIds || []);
    
    if (isEdit && surveyId) {
      setShowSurveyLink(true);
    }
  };

  const handlePreviewClick = async () => {
    if (!onPreviewSurvey) return;
    
    setIsPreviewing(true);
    
    try {
      // If we already have a survey ID, open the preview directly
      if (surveyId) {
        const previewUrl = `${window.location.origin}/survey?id=${surveyId}&preview=true`;
        window.open(previewUrl, '_blank');
      } else {
        // Otherwise, trigger the preview handler which will save first
        onPreviewSurvey();
      }
    } finally {
      setIsPreviewing(false);
    }
  };
  
  const handleSendSurvey = async () => {
    if (!onSendSurvey) return;
    
    setIsSending(true);
    
    try {
      // Directly call the send handler without requiring a save first
      onSendSurvey();
    } finally {
      // The setting back to false will happen in practice when the page navigates
      // But we set it here anyway as a safeguard
      setIsSending(false);
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
          
          <div className="mt-8 flex flex-wrap gap-4 sm:flex-row flex-col">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="flex-1 sm:flex-none sm:order-1" 
                    disabled={isSubmitting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Saving...' : submitButtonText}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Save survey without sending it</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="flex-1 sm:flex-none sm:order-2" 
                    onClick={handlePreviewClick}
                    disabled={isSubmitting || isPreviewing}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isPreviewing ? 'Opening Preview...' : 'Preview Survey'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>See how the survey will look to recipients</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="default" 
                    className="flex-1 sm:flex-none sm:order-3 bg-brandPurple-500 hover:bg-brandPurple-600" 
                    onClick={handleSendSurvey}
                    disabled={isSubmitting || isSending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSending ? 'Sending Survey...' : 'Send Survey'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{form.watch("distributionMethod") === "email" ? 
                    "Send email invitations to recipients" : 
                    "Generate shareable link and mark as sent"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
