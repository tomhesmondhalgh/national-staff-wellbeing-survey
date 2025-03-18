
import React from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { SignUpFormData } from '../../types/auth';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  invitationData?: any; // Add support for invitation data
}

const AuthForm: React.FC<AuthFormProps> = ({ 
  mode, 
  onSubmit, 
  isLoading = false,
  invitationData
}) => {
  console.log('AuthForm rendering with mode:', mode); // Add debugging
  
  // Make sure we're correctly rendering the SignUpForm when in signup mode
  if (mode === 'login') {
    return <LoginForm onSubmit={onSubmit} isLoading={isLoading} />;
  }
  
  return (
    <SignUpForm 
      onSubmit={(data: SignUpFormData) => {
        console.log('SignUpForm submitted with data:', data);
        onSubmit(data);
      }} 
      isLoading={isLoading}
    />
  );
};

export default AuthForm;
