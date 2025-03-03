
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Plus, X } from 'lucide-react';
import { QuestionItem } from './QuestionsList';

interface QuestionFormProps {
  initialData?: QuestionItem | null;
  onSubmit: (data: {
    text: string;
    type: 'text' | 'dropdown';
    options: string[] | null;
  }) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'dropdown'>('text');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<{ 
    text?: string; 
    options?: string;
    newOption?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.text);
      setQuestionType(initialData.type);
      setOptions(initialData.options || []);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: { text?: string; options?: string } = {};
    
    if (!questionText.trim()) {
      newErrors.text = 'Question text is required';
    }
    
    if (questionType === 'dropdown' && options.length === 0) {
      newErrors.options = 'At least one option is required for dropdown questions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        text: questionText,
        type: questionType,
        options: questionType === 'dropdown' ? options : null
      });
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim()) {
      setErrors({ ...errors, newOption: 'Option text cannot be empty' });
      return;
    }
    
    setOptions([...options, newOption.trim()]);
    setNewOption('');
    setErrors({ ...errors, options: undefined, newOption: undefined });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    if (newOptions.length === 0) {
      setErrors({ ...errors, options: 'At least one option is required for dropdown questions' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newOption.trim()) {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">
          {initialData ? 'Edit Question' : 'Create New Question'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Input
              id="question-text"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                if (e.target.value.trim()) {
                  setErrors({ ...errors, text: undefined });
                }
              }}
              placeholder="Enter your question text"
              className={errors.text ? 'border-red-500' : ''}
            />
            {errors.text && <p className="text-sm text-red-500">{errors.text}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Question Type</Label>
            <RadioGroup 
              value={questionType} 
              onValueChange={(value) => setQuestionType(value as 'text' | 'dropdown')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="type-text" />
                <Label htmlFor="type-text" className="cursor-pointer">Free Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dropdown" id="type-dropdown" />
                <Label htmlFor="type-dropdown" className="cursor-pointer">Dropdown</Label>
              </div>
            </RadioGroup>
          </div>
          
          {questionType === 'dropdown' && (
            <div className="space-y-4">
              <div>
                <Label>Dropdown Options</Label>
                {errors.options && <p className="text-sm text-red-500 mt-1">{errors.options}</p>}
                
                <div className="mt-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div className="bg-gray-50 text-gray-700 px-3 py-2 rounded border border-gray-200 flex-1">
                        {option}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="ml-2 text-gray-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-option">Add Option</Label>
                <div className="flex mt-1">
                  <Input
                    id="new-option"
                    value={newOption}
                    onChange={(e) => {
                      setNewOption(e.target.value);
                      if (e.target.value.trim()) {
                        setErrors({ ...errors, newOption: undefined });
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter an option"
                    className={`flex-1 ${errors.newOption ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    onClick={handleAddOption}
                    className="ml-2 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add
                  </Button>
                </div>
                {errors.newOption && <p className="text-sm text-red-500 mt-1">{errors.newOption}</p>}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
