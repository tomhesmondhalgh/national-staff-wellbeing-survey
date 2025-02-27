
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    jobTitle: '',
    schoolName: '',
    schoolAddress: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-md w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'login' ? 'Log in to your account' : 'Create your account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job title
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                required
                className="form-input w-full"
                value={formData.jobTitle}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School/College name
              </label>
              <input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                className="form-input w-full"
                value={formData.schoolName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-1">
                School/College address
              </label>
              <textarea
                id="schoolAddress"
                name="schoolAddress"
                rows={3}
                required
                className="form-input w-full"
                value={formData.schoolAddress}
                onChange={handleChange}
              />
            </div>
          </>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-input w-full"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            className="form-input w-full"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <button type="submit" className="btn-primary w-full mt-2">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        {mode === 'login' ? (
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="text-brandPurple-600 hover:text-brandPurple-700 font-medium">
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-brandPurple-600 hover:text-brandPurple-700 font-medium">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
