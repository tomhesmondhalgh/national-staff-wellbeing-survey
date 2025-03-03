
import React from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'dropdown';
  options: string[] | null;
}

interface CustomQuestionsProps {
  questions: CustomQuestion[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  errors: Record<string, string>;
}

const CustomQuestions: React.FC<CustomQuestionsProps> = ({
  questions,
  values,
  onChange,
  errors
}) => {
  // If there are no questions, or the array is empty, return null
  if (!questions || questions.length === 0) {
    return null;
  }

  // Filter out any null values from the questions array
  const validQuestions = questions.filter(question => question != null);

  if (validQuestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mt-10">
      <div className="border-t pt-8">
        <h3 className="text-xl font-semibold mb-6">Additional Questions</h3>
        
        {validQuestions.map((question) => (
          <div key={question.id} className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              {question.text}
            </label>
            
            {question.type === 'text' ? (
              <Textarea
                value={values[question.id] || ''}
                onChange={(e) => onChange(question.id, e.target.value)}
                placeholder="Your answer"
                rows={4}
                className={errors[question.id] ? 'border-red-500' : ''}
              />
            ) : (
              <Select 
                value={values[question.id] || ''} 
                onValueChange={(value) => onChange(question.id, value)}
              >
                <SelectTrigger className={`w-full ${errors[question.id] ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options && question.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {errors[question.id] && (
              <p className="text-red-500 text-sm mt-1">{errors[question.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomQuestions;
