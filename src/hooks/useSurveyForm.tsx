
import { useState } from 'react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { submitCustomQuestionResponses, addQuestionsToSurvey } from '../utils/customQuestionsUtils';

export const useSurveyForm = (surveyId?: string | null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
  const [emails, setEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  const [emailsError, setEmailsError] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [customQuestionValues, setCustomQuestionValues] = useState<Record<string, string>>({});
  const [customQuestionErrors, setCustomQuestionErrors] = useState<Record<string, string>>({});
  // Fix: Properly type currentSurvey as Record<string, string>
  const [currentSurvey, setCurrentSurvey] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setDateError('');
    setEmailsError('');

    if (!name.trim()) {
      setNameError('Survey name is required');
      isValid = false;
    }

    if (!date) {
      setDateError('Survey date is required');
      isValid = false;
    }

    if (emails.trim() && !emails.split(',').every(email => email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) {
      setEmailsError('Please enter a valid comma-separated list of email addresses');
      isValid = false;
    }

    return isValid;
  };

  const validateCustomQuestions = (questions: any[]) => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    questions.forEach(question => {
      if (!customQuestionValues[question.id] || !customQuestionValues[question.id].trim()) {
        errors[question.id] = 'This field is required';
        isValid = false;
      }
    });
    
    setCustomQuestionErrors(errors);
    return isValid;
  };

  const handleSelectQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    } else {
      setSelectedQuestions(prev => [...prev, questionId]);
    }
  };

  const handleCustomQuestionChange = (id: string, value: string) => {
    setCustomQuestionValues(prev => ({
      ...prev,
      [id]: value
    }));
    
    if (customQuestionErrors[id]) {
      setCustomQuestionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, customQuestions: any[]) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (customQuestions.length > 0 && !validateCustomQuestions(customQuestions)) {
      document.querySelector('.custom-questions-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = date ? date.toISOString() : '';
      const formattedCloseDate = closeDate ? closeDate.toISOString() : null;

      let surveyResult;
      if (surveyId) {
        const { data, error } = await supabase
          .from('survey_templates')
          .update({
            name: name.trim(),
            date: formattedDate,
            close_date: formattedCloseDate,
            emails: emails.trim()
          })
          .eq('id', surveyId)
          .select()
          .single();
          
        if (error) throw error;
        surveyResult = data;
      } else {
        const { data, error } = await supabase
          .from('survey_templates')
          .insert({
            name: name.trim(),
            date: formattedDate,
            close_date: formattedCloseDate,
            emails: emails.trim(),
            creator_id: user?.id
          })
          .select()
          .single();
          
        if (error) throw error;
        surveyResult = data;
      }

      if (!surveyResult) {
        toast.error("Failed to create survey");
        return;
      }
      
      if (surveyResult && selectedQuestions.length > 0) {
        const addQuestionsResult = await addQuestionsToSurvey(surveyResult.id, selectedQuestions);
        if (!addQuestionsResult) {
          toast.error("Failed to add custom questions to the survey");
        }
      }

      const responseId = surveyResult.id;
      
      if (responseId && customQuestions.length > 0) {
        const customResponses = Object.entries(customQuestionValues).map(([questionId, answer]) => ({
          questionId,
          answer
        }));
        
        await submitCustomQuestionResponses(responseId, customResponses);
      }

      if (emails.trim()) {
        const emailList = emails.split(',').map(email => email.trim());
        
        const { error: emailError } = await supabase.functions.invoke('send-survey-email', {
          body: {
            surveyId: surveyResult.id,
            surveyName: name.trim(),
            emails: emailList,
            surveyUrl: `${window.location.origin}/survey?id=${surveyResult.id}`,
            isReminder: false
          }
        });
        
        if (emailError) {
          console.error('Error sending emails:', emailError);
          toast.error("Survey created but emails could not be sent");
        } else {
          toast.success("Survey created and invitations sent");
        }
      }

      setName('');
      setDate(undefined);
      setCloseDate(undefined);
      setEmails('');
      setCustomQuestionValues({});
      setSelectedQuestions([]);

      toast.success("Survey created successfully!", {
        description: "Redirecting to surveys page..."
      });

      setTimeout(() => {
        navigate('/surveys');
      }, 1500);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error("Failed to create survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name: fieldName, value } = e.target;
    if (fieldName === 'name') {
      setName(value);
    } else if (fieldName === 'emails') {
      setEmails(value);
    }
    
    // Fixed TypeScript error by ensuring correct typing of prev parameter
    setCurrentSurvey(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  return {
    name,
    setName,
    date,
    setDate,
    closeDate,
    setCloseDate,
    emails,
    setEmails,
    isSubmitting,
    nameError,
    dateError,
    emailsError,
    selectedQuestions,
    customQuestionValues,
    customQuestionErrors,
    currentSurvey,
    validateForm,
    validateCustomQuestions,
    handleSelectQuestion,
    handleCustomQuestionChange,
    handleSubmit,
    handleChange
  };
};
