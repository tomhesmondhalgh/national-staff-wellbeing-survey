
import React from 'react';
import { Input } from '../ui/input';

interface PersonalDetailsFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  firstName,
  lastName,
  email,
  password,
  onChange,
  isLoading
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First name
          </label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="form-input w-full"
            value={firstName}
            onChange={onChange}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="form-input w-full"
            value={lastName}
            onChange={onChange}
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="form-input w-full"
          value={email}
          onChange={onChange}
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="form-input w-full"
          value={password}
          onChange={onChange}
          disabled={isLoading}
        />
      </div>
    </>
  );
};

export default PersonalDetailsForm;
