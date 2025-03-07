
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
        // Let Supabase handle the token exchange automatically
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log("Current auth state:", authData);
          
        if (authError) {
          console.error("Auth error:", authError);
        }
        
        // Check if we need to process the URL for recovery tokens
        // Extract hash params - could be a hash or query string
        const hashParams = location.hash.substring(1);
        const queryParams = location.search.substring(1);
        
        // Try both hash and query params
        const paramsString = hashParams || queryParams;
        const params = new URLSearchParams(paramsString);
        
        // Check for type and token params
        const type = params.get('type');
        const token = params.get('token');
        const accessToken = params.get('access_token');
        
        console.log("Token parameters:", { type, token, accessToken });
        
        // If we have recovery tokens but no session, try to exchange them
        if ((type === 'recovery' || type === 'email') && (token || accessToken)) {
          console.log("Found recovery tokens, attempting to exchange");
          
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token || accessToken || '',
              type: 'recovery',
            });
            
            if (error) {
              console.error("Token verification error:", error);
              setPageState('invalid');
              return;
            }
            
            console.log("Token exchange successful:", data);
            setPageState('ready');
            return;
          } catch (verifyError) {
            console.error("Error verifying token:", verifyError);
          }
        }
        
        // Check if we already have a valid session
        if (authData.session) {
          console.log("User has valid session");
          setPageState('ready');
          return;
        }
        
        // If we reach here without a valid session or token, the link is invalid
        console.log("No valid session or token found");
        setPageState('invalid');
        
        // After a delay, navigate to login
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
