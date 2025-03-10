
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomQuestion } from '../../types/customQuestions';
import { AlertCircle } from 'lucide-react';
import { toValidQuestionType, createDbQuestionPayload } from '../../utils/questionTypeUtils';

interface QuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (questionData: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>) => Promise<void>;
  initialData?: CustomQuestion;
}

export default function QuestionModal({
  open,
  onOpenChange,
  onSave,
  initialData
}: QuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && initialData) {
      setQuestionText(initialData.text);
    } else if (!open) {
      setQuestionText('');
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

    setIsSubmitting(true);
    try {
      const questionPayload = createDbQuestionPayload({
        text: questionText,
        type: 'text'
      });
      
      await onSave(questionPayload);
      onOpenChange(false);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Failed to save question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Question' : 'Create Question'}
          </DialogTitle>
          <DialogDescription>
            Create a custom question for your surveys
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Input
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={100}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
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
