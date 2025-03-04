
import React from 'react';
import { cn } from '../../lib/utils';

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
}

const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange, options, error }) => {
  return (
    <div className="mb-10">
      <label htmlFor="role" className="block text-lg font-medium mb-2 text-left">
        What's Your Role Within School or College? <span className="text-red-500">*</span>
      </label>
      <select
        id="role"
        name="role"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brandPurple-500 focus:border-transparent",
          error ? "border-red-500" : "border-gray-300"
        )}
      >
        <option value="">Select your role</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
    </div>
  );
};

export default RoleSelect;
