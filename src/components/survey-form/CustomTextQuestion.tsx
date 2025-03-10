
import React from 'react';
import { cn } from '../../lib/utils';

interface CustomTextQuestionProps { 
  label: string; 
  name: string; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
}

const CustomTextQuestion: React.FC<CustomTextQuestionProps> = ({ 
  label, 
  name, 
  value,
  onChange,
  error,
  required = true,
  maxLength = 1000
}) => (
  <div className="mb-10">
    <label htmlFor={name} className="block text-lg font-medium mb-2 text-left">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={name}
      name={name}
      rows={4}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className={cn(
        "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brandPurple-500 focus:border-transparent",
        error ? "border-red-500" : "border-gray-300"
      )}
    />
    {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
  </div>
);

export default CustomTextQuestion;
