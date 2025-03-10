
import { useState, useEffect } from 'react';
import { CustomQuestion } from '../../../types/customQuestions';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

// Constants
export const MAX_OPTIONS = 5;
export const MAX_TEXT_LENGTH = 100;

export function useQuestionForm(
  open: boolean,
  initialData?: CustomQuestion,
  onSave?: (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => Promise<any>
) {
  // State
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple-choice'>('text');
  const [options, setOptions] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setQuestionText(initialData.text || '');
        setQuestionType(initialData.type || 'text');
        setOptions(initialData.options?.length ? initialData.options : ['']);
      } else {
        // Reset form for new question
        setQuestionText('');
        setQuestionType('text');
        setOptions(['']);
      }
      setErrors({});
    }
  }, [initialData, open]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    } else if (questionText.length > MAX_TEXT_LENGTH) {
      newErrors.questionText = `Question text must be ${MAX_TEXT_LENGTH} characters or less`;
    }
    
    if (questionType === 'multiple-choice') {
      options.forEach((option, index) => {
        if (!option.trim()) {
          newErrors[`option_${index}`] = 'Option text is required';
        } else if (option.length > MAX_TEXT_LENGTH) {
          newErrors[`option_${index}`] = `Option text must be ${MAX_TEXT_LENGTH} characters or less`;
        }
      });
      
      if (options.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Option management
  const addOption = () => {
    if (options.length < MAX_OPTIONS) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!user) {
      toast.error('You must be logged in to create or edit questions');
      return;
    }
    
    if (!onSave) {
      toast.error('Save handler is not defined');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const questionData = {
        text: questionText,
        type: questionType,
        options: questionType === 'multiple-choice' ? options.filter(o => o.trim()) : undefined,
        creator_id: initialData?.creator_id || user.id
      };
      
      const result = await onSave(questionData);
      return result;
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question. Please try again.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    questionText,
    setQuestionText,
    questionType,
    setQuestionType,
    options,
    updateOption,
    addOption,
    removeOption,
    isSubmitting,
    errors,
    handleSubmit
  };
}
