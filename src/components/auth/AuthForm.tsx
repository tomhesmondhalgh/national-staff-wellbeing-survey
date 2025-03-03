
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, isLoading = false }) => {
  const navigate = useNavigate();
  const { signInWithSocialProvider } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    try {
      setSocialLoading(provider);
      await signInWithSocialProvider(provider);
      // User will be redirected to the provider's authentication page and then to onboarding
    } catch (error) {
      console.error(`Error when trying to sign in with ${provider}:`, error);
      setSocialLoading(null);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'login' ? 'Log in to your account' : 'Create your account'}
      </h2>
      
      {/* Social Login Buttons */}
      <div className="flex flex-col space-y-4 mb-6">
        <button
          type="button"
          className="btn flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading || !!socialLoading}
        >
          {socialLoading === 'google' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </button>
        
        <button
          type="button"
          className="btn flex items-center justify-center gap-2 bg-[#0078d4] hover:bg-[#106ebe] text-white"
          onClick={() => handleSocialLogin('azure')}
          disabled={isLoading || !!socialLoading}
        >
          {socialLoading === 'azure' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.0001 11.0001H0.333496V0.333496H11.0001V11.0001Z" fill="white"/>
              <path d="M22.6668 11.0001H12.0001V0.333496H22.6668V11.0001Z" fill="white"/>
              <path d="M11.0001 22.6667H0.333496V12H11.0001V22.6667Z" fill="white"/>
              <path d="M22.6668 22.6667H12.0001V12H22.6668V22.6667Z" fill="white"/>
            </svg>
          )}
          Continue with Microsoft
        </button>
      </div>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
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
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                {mode === 'login' ? 'Logging in...' : 'Continuing...'}
              </>
            ) : (
              <>{mode === 'login' ? 'Log in' : 'Continue'}</>
            )}
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
