
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import SurveyFormInputs from './SurveyFormInputs';
import SurveyLink from './SurveyLink';

interface SurveyFormProps {
  onSubmit: (data: SurveyFormData) => void;
  initialData?: Partial<SurveyFormData>;
  submitButtonText?: string;
  isEdit?: boolean;
}

export interface SurveyFormData {
  date: string;
  closeDate: string;
  emails: string;
  name?: string;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ 
  onSubmit, 
  initialData,
  submitButtonText = 'Create Survey',
  isEdit = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SurveyFormData>({
    name: initialData?.name || `Survey ${new Date().toLocaleDateString()}`,
    date: initialData?.date || '',
    closeDate: initialData?.closeDate || '',
    emails: initialData?.emails || ''
  });
  
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Log the data being submitted
      console.log(isEdit ? "Updating survey with data:" : "Creating survey with data:", formData);
      
      if (!isEdit) {
        // Save the survey template to the database
        const { data, error } = await supabase
          .from('survey_templates')
          .insert([
            {
              name: formData.name,
              date: formData.date,
              close_date: formData.closeDate,
              creator_id: user?.id,
              emails: formData.emails // Save emails to the database
            }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating survey:', error);
          toast.error("Failed to create survey", {
            description: error.message
          });
          return;
        }
        
        console.log("Survey created successfully:", data);
        
        // Set the survey URL
        const surveyId = data.id;
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/survey?id=${surveyId}`;
        setSurveyUrl(url);
      }
      
      // Call the onSubmit prop with the form data
      onSubmit(formData);
      
      toast.success(isEdit ? "Survey updated successfully" : "Survey created successfully", {
        description: isEdit ? "Your survey has been updated." : "Your survey has been created and is ready to share."
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("An error occurred", {
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="card p-6 animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <SurveyFormInputs 
          formData={formData}
          handleChange={handleChange}
          isSubmitting={isSubmitting}
        />
        
        <div className={`${isEdit ? 'flex justify-center' : 'flex justify-end'} mt-8`}>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : submitButtonText}
          </button>
        </div>
      </form>
      
      {!isEdit && <SurveyLink surveyUrl={surveyUrl} />}
    </div>
  );
};

export default SurveyForm;
