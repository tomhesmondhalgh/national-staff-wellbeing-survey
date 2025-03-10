
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomQuestion } from '../../types/customQuestions';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface QuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => Promise<void>;
  initialData?: CustomQuestion;
}

export default function QuestionModal({
  open,
  onOpenChange,
  onSave,
  initialData
}: QuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple-choice'>('text');
  const [options, setOptions] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initialData) {
      setQuestionText(initialData.text);
      setQuestionType(initialData.type);
      setOptions(initialData.options || ['']);
    } else if (!open) {
      setQuestionText('');
      setQuestionType('text');
      setOptions(['']);
      setError('');
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (questionType === 'multiple-choice' && options.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        text: questionText,
        type: questionType,
        options: questionType === 'multiple-choice' ? options.filter(o => o.trim()) : undefined,
        creator_id: initialData?.creator_id || ''
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Question' : 'Create Question'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <RadioGroup
              value={questionType}
              onValueChange={(value) => setQuestionType(value as 'text' | 'multiple-choice')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text">Free Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple-choice" id="multiple-choice" />
                <Label htmlFor="multiple-choice">Multiple Choice</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Input
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={100}
            />
          </div>

          {questionType === 'multiple-choice' && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeOption(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-2"
                >
                  Add Option
                </Button>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
