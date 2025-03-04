
import React from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading = false }) => {
  return mode === 'login' ? (
    <LoginForm onSubmit={onSubmit} isLoading={isLoading} />
  ) : (
    <SignUpForm onSubmit={onSubmit} isLoading={isLoading} />
  );
};

export default AuthForm;
