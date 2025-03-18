
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Input } from '../ui/input';

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  jobTitle: string;
  schoolName: string;
  customStreetAddress: string;
  customStreetAddress2: string;
  customCity: string;
  customCounty: string;
  customPostalCode: string;
  customCountry: string;
}

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => void;
  isLoading?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    jobTitle: '',
    schoolName: '',
    customStreetAddress: '',
    customStreetAddress2: '',
    customCity: '',
    customCounty: '',
    customPostalCode: '',
    customCountry: 'United Kingdom',
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
    <div className="max-w-2xl w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">
        Create your account
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              value={formData.firstName}
              onChange={handleChange}
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
          <Input
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
          <Input
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
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Professional details</h3>
          
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
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">School/College details</h4>
            
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School/College name
              </label>
              <Input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                className="form-input w-full"
                value={formData.schoolName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-2">
              <label htmlFor="customStreetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Street address
              </label>
              <Input
                id="customStreetAddress"
                name="customStreetAddress"
                type="text"
                required
                className="form-input w-full"
                value={formData.customStreetAddress}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-2">
              <label htmlFor="customStreetAddress2" className="block text-sm font-medium text-gray-700 mb-1">
                Street address 2 (optional)
              </label>
              <Input
                id="customStreetAddress2"
                name="customStreetAddress2"
                type="text"
                className="form-input w-full"
                value={formData.customStreetAddress2}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="customCity" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <Input
                  id="customCity"
                  name="customCity"
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.customCity}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="customCounty" className="block text-sm font-medium text-gray-700 mb-1">
                  County (optional)
                </label>
                <Input
                  id="customCounty"
                  name="customCounty"
                  type="text"
                  className="form-input w-full"
                  value={formData.customCounty}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="customPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal code
                </label>
                <Input
                  id="customPostalCode"
                  name="customPostalCode"
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.customPostalCode}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="customCountry" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input
                  id="customCountry"
                  name="customCountry"
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.customCountry}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            className="btn-primary w-full mt-4 flex justify-center items-center" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>Create Account</>
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
