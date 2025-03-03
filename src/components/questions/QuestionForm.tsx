
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { X, Plus } from 'lucide-react';
import { CustomQuestion } from '../../types/customQuestions';
import { createCustomQuestion, updateCustomQuestion } from '../../utils/customQuestionsUtils';

interface QuestionFormProps {
  onSuccess: () => void;
  questionToEdit?: CustomQuestion | null;
  onCancel?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  onSuccess, 
  questionToEdit = null,
  onCancel
}) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'dropdown'>('text');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (questionToEdit) {
      setQuestionText(questionToEdit.text);
      setQuestionType(questionToEdit.type);
      setOptions(questionToEdit.options || []);
    }
  }, [questionToEdit]);

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    
    if (questionType === 'dropdown' && options.length === 0) {
      toast.error("Dropdown questions require at least one option");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine if we're creating or updating
      let result;
      
      if (questionToEdit) {
        result = await updateCustomQuestion(
          questionToEdit.id,
          questionText,
          questionType,
          questionType === 'dropdown' ? options : null
        );
        
        if (result) {
          toast.success("Question updated successfully");
        } else {
          toast.error("Failed to update question");
        }
      } else {
        result = await createCustomQuestion(
          questionText,
          questionType,
          questionType === 'dropdown' ? options : null
        );
        
        if (result) {
          toast.success("Question created successfully");
        } else {
          toast.error("Failed to create question");
        }
      }
      
      if (result) {
        // Reset form
        setQuestionText('');
        setQuestionType('text');
        setOptions([]);
        onSuccess();
      }
    } catch (error) {
      console.error('Error in question form:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="question-text">Question Text</Label>
          <Textarea
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here"
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="question-type">Question Type</Label>
          <Select
            value={questionType}
            onValueChange={(value: 'text' | 'dropdown') => setQuestionType(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text (Free Response)</SelectItem>
              <SelectItem value="dropdown">Dropdown (Select One)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {questionType === 'dropdown' && (
          <div className="space-y-2">
            <Label>Options</Label>
            
            <div className="space-y-2 mt-1">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-grow px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                    {option}
                  </span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add an option"
                className="flex-grow"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddOption}
                disabled={!newOption.trim()}
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>
            
            {options.length === 0 && (
              <p className="text-sm text-amber-600">
                Add at least one option for dropdown questions.
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting 
            ? (questionToEdit ? 'Updating...' : 'Creating...') 
            : (questionToEdit ? 'Update Question' : 'Create Question')}
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;
