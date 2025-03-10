
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { CustomQuestion } from '../../types/customQuestions';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface CustomQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => Promise<any>;
  initialData?: CustomQuestion;
  isEdit?: boolean;
}

// Constants
const MAX_OPTIONS = 5;
const MAX_TEXT_LENGTH = 100;

const CustomQuestionModal: React.FC<CustomQuestionModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEdit = false
}) => {
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

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (!user) {
      toast.error('You must be logged in to create or edit questions');
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
      
      if (result) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Question' : 'Create Custom Question'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update your custom question details below.' 
              : 'Add a new custom question to include in your surveys.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Question Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="question-type">Question Type</Label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="text-type"
                  name="question-type"
                  value="text"
                  checked={questionType === 'text'}
                  onChange={() => setQuestionType('text')}
                  className="mr-2"
                />
                <Label htmlFor="text-type" className="cursor-pointer">Free Text</Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="multiple-choice"
                  name="question-type"
                  value="multiple-choice"
                  checked={questionType === 'multiple-choice'}
                  onChange={() => setQuestionType('multiple-choice')}
                  className="mr-2"
                />
                <Label htmlFor="multiple-choice" className="cursor-pointer">Multiple Choice</Label>
              </div>
            </div>
          </div>
          
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">
              Question Text {questionText.length}/{MAX_TEXT_LENGTH}
            </Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question"
              className={errors.questionText ? "border-red-500" : ""}
              maxLength={MAX_TEXT_LENGTH}
            />
            {errors.questionText && (
              <p className="text-red-500 text-sm">{errors.questionText}</p>
            )}
          </div>
          
          {/* Multiple Choice Options */}
          {questionType === 'multiple-choice' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Answer Options (Max {MAX_OPTIONS})</Label>
                <Button 
                  type="button" 
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                  disabled={options.length >= MAX_OPTIONS}
                >
                  <Plus size={16} className="mr-1" /> Add Option
                </Button>
              </div>
              
              {errors.options && (
                <p className="text-red-500 text-sm">{errors.options}</p>
              )}
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className={errors[`option_${index}`] ? "border-red-500" : ""}
                      maxLength={MAX_TEXT_LENGTH}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 1}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                    {errors[`option_${index}`] && (
                      <p className="text-red-500 text-sm absolute mt-10">{errors[`option_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Saving...' 
              : (isEdit ? 'Update Question' : 'Create Question')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomQuestionModal;
