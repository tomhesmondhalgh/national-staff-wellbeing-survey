
import React from 'react';

interface RadioQuestionProps { 
  label: string; 
  name: string; 
  options: string[]; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const RadioQuestion: React.FC<RadioQuestionProps> = ({ 
  label, 
  name, 
  options, 
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
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:space-x-4 text-left">
        {options.map((option) => (
          <div key={option} className="flex items-center mb-2">
            <input
              type="radio"
              id={`${name}-${option}`}
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
              className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
            />
            <label htmlFor={`${name}-${option}`} className="ml-2 text-sm text-gray-700">
              {option}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
    </fieldset>
  </div>
);

export default RadioQuestion;
