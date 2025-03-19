
import React from 'react';
import { cn } from '../../lib/utils';

interface RatingQuestionProps { 
  label: string; 
  name: string; 
  options?: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const RatingQuestion: React.FC<RatingQuestionProps> = ({ 
  label, 
  name, 
  options = ["Strongly disagree", "Disagree", "Agree", "Strongly agree"],
  value,
  onChange,
  error,
  required = true 
}) => (
  <div className="mb-10">
    <fieldset>
      <legend className="text-lg font-medium mb-3 text-left">
        {label} {required && <span className="text-red-500">*</span>}
      </legend>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
        {options.map((option, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center space-x-2 p-3 rounded-md transition-all border",
              value === option
                ? "bg-brandPurple-100 border-brandPurple-400 shadow-sm" 
                : "hover:bg-gray-50 border-gray-200"
            )}
          >
            <input
              type="radio"
              id={`${name}-${index}`}
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
            />
            <label htmlFor={`${name}-${index}`} className="text-sm text-gray-700 cursor-pointer">
              {option}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
    </fieldset>
  </div>
);

export default RatingQuestion;
