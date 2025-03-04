
import React from 'react';
import { Input } from '../ui/input';

interface JobTitleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const JobTitleInput: React.FC<JobTitleInputProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div>
      <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
        Job title
      </label>
      <Input
        id="jobTitle"
        name="jobTitle"
        type="text"
        required
        className="form-input w-full"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default JobTitleInput;
