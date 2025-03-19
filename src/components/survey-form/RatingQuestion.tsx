
import React from 'react';

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${name}-${index}`}
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
            />
            <label htmlFor={`${name}-${index}`} className="text-sm text-gray-700">
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
