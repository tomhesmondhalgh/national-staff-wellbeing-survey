
import React from 'react';
import { cn } from '../../lib/utils';

interface TextQuestionProps { 
  label: string; 
  name?: string; 
  value: string;
  onChange: (value: string) => void;
  subtitle?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const TextQuestion: React.FC<TextQuestionProps> = ({ 
  label, 
  name, 
  value,
  onChange,
  subtitle,
  error,
  placeholder = "Please share your thoughts...",
  required = false 
}) => (
  <div className="mb-10">
    <label htmlFor={name} className="block text-lg font-medium mb-2 text-left">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {subtitle && <p className="text-sm text-gray-600 mb-2 text-left">{subtitle}</p>}
    <textarea
      id={name}
      name={name}
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brandPurple-500 focus:border-transparent",
        error ? "border-red-500" : "border-gray-300"
      )}
    />
    {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
  </div>
);

export default TextQuestion;
