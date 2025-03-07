
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { supabase } from '../lib/supabase';
import { updatePassword } from '../utils/authUtils';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pageState, setPageState] = useState<'checking' | 'ready' | 'invalid' | 'success'>('checking');
  const navigate = useNavigate();
  const location = useLocation();

  // Extract tokens from URL if present
  useEffect(() => {
    const handleHashParams = async () => {
      // First, log everything for debugging
      console.log("--- Reset Password Debug ---");
      console.log("Current URL:", window.location.href);
      console.log("URL hash:", window.location.hash);
      console.log("URL search params:", window.location.search);
      
      try {
        // Get URL fragments
        const hash = window.location.hash.substring(1);
        const query = new URLSearchParams(hash || window.location.search);
        
        // Check for error
        const errorCode = query.get('error');
        const errorDescription = query.get('error_description');
        
        if (errorCode || errorDescription) {
          console.error("Auth error from URL:", errorCode, errorDescription);
          setPageState('invalid');
          toast.error('Reset link error', {
            description: errorDescription || 'Please request a new password reset link'
          });
          return;
        }
        
        // Extract token from hash - either using type+access_token pattern or direct token approach
        const tokenType = query.get('type');
        const accessToken = query.get('access_token');
        const token = query.get('token');
        
        console.log("Token analysis:", { tokenType, accessToken, token });
        
        let hasValidSession = false;
        
        // First try to verify the current session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session:", sessionData);
        
        if (sessionData?.session) {
          hasValidSession = true;
          console.log("User has an active session already");
        }
        // If we have recovery token parameters, try to use them
        else if ((tokenType === 'recovery' && accessToken) || token) {
          console.log("Found recovery tokens in URL, attempting to process");
          
          // Try to exchange the token for a session
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token || accessToken || '',
            type: 'recovery',
          });
          
          if (error) {
            console.error("Error verifying recovery token:", error);
            setPageState('invalid');
            toast.error('Invalid or expired reset link', {
              description: 'Please request a new password reset link'
            });
            return;
          }
          
          console.log("Recovery verification result:", data);
          
          if (data?.session) {
            hasValidSession = true;
            console.log("Successfully verified recovery token");
          }
        }
        
        if (hasValidSession) {
          setPageState('ready');
        } else {
          setPageState('invalid');
          toast.error('Invalid or expired reset link', {
            description: 'Please request a new password reset link'
          });
          
          // Redirect after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        console.error("Error processing reset tokens:", error);
        setPageState('invalid');
      }
    };

    handleHashParams();
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error, success } = await updatePassword(password);
      
      if (success) {
        setPageState('success');
        toast.success('Password updated successfully', {
          description: 'You can now log in with your new password'
        });
        
        // Sign out the user to clear the recovery session
        await supabase.auth.signOut();
        
        // Redirect to login page after success
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case 'checking':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-brandPurple-600 mb-4" />
            <p className="text-gray-600">Validating your reset link...</p>
          </div>
        );
        
      case 'invalid':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle size={40} className="text-red-500 mb-4" />
            <p className="text-gray-600 text-center">Invalid or expired reset link.</p>
            <p className="text-sm text-gray-500 mt-2">You'll be redirected to the login page shortly.</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle size={40} className="text-green-500 mb-4" />
            <p className="text-gray-600 text-center">Password updated successfully!</p>
            <p className="text-sm text-gray-500 mt-2">You'll be redirected to login with your new password.</p>
          </div>
        );
        
      case 'ready':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`form-input w-full ${passwordError ? 'border-red-500' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`form-input w-full ${passwordError ? 'border-red-500' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn-primary w-full flex justify-center items-center" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Reset Your Password" 
          subtitle="Enter a new password for your account"
          alignment="center"
        />
        
        <div className="max-w-md w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
