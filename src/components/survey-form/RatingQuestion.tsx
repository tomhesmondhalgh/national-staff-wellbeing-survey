
import React from 'react';

interface RatingQuestionProps { 
  label: string; 
  name: string; 
  min: number; 
  max: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const RatingQuestion: React.FC<RatingQuestionProps> = ({ 
  label, 
  name, 
  min, 
  max,
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
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-left">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
          <div key={num} className="flex flex-col items-center">
            <input
              type="radio"
              id={`${name}-${num}`}
              name={name}
              value={num}
              checked={value === num.toString()}
              onChange={onChange}
              className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
            />
            <label htmlFor={`${name}-${num}`} className="mt-1 text-sm text-gray-700">
              {num}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
    </fieldset>
  </div>
);

export default RatingQuestion;
