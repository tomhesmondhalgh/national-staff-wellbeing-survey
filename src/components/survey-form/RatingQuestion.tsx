
import React from 'react';
import { cn } from '../../lib/utils';

interface RatingQuestionProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const RatingQuestion: React.FC<RatingQuestionProps> = ({
  label,
  name,
  value,
  onChange,
  required = true
}) => {
  const options = ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree'];

  return (
    <div className="mb-10">
      <fieldset>
        <legend className="text-lg font-medium mb-3 text-left">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>
        <div className="grid grid-cols-4 gap-1 text-center">
          {options.map((option) => (
            <div 
              key={option} 
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md transition-all border cursor-pointer",
                value === option
                  ? "bg-brandPurple-100 border-brandPurple-400 shadow-sm" 
                  : "hover:bg-gray-50 border-gray-200",
                "hover:shadow-sm"
              )}
              onClick={() => {
                const event = {
                  target: {
                    name,
                    value: option
                  }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
              }}
            >
              <input
                type="radio"
                id={`${name}-${option}`}
                name={name}
                value={option}
                checked={value === option}
                onChange={onChange}
                className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300 sr-only"
                required={required}
              />
              <label htmlFor={`${name}-${option}`} className="text-sm text-gray-700 cursor-pointer whitespace-nowrap text-center">
                {option}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default RatingQuestion;
