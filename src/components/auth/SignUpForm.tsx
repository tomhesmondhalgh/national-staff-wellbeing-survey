
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';

interface SignUpFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        Create your account
      </h2>
      
      <SocialLoginButtons isLoading={isLoading} />
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </div>
        
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
            disabled={isLoading}
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
            autoComplete="new-password"
            required
            className="form-input w-full"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <button 
            type="submit" 
            className="btn-primary w-full mt-2 flex justify-center items-center" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Continuing...
              </>
            ) : (
              <>Continue</>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-brandPurple-600 hover:text-brandPurple-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
