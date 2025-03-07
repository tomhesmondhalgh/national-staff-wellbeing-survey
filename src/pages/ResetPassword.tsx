
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { supabase } from '../lib/supabase/client';
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

  // Enhanced logging for debugging
  useEffect(() => {
    console.log("Reset Password Page Loaded");
    console.log("Current full URL:", window.location.href);
    console.log("URL hash:", window.location.hash);
    console.log("URL search params:", window.location.search);
    console.log("Path:", location.pathname);
  }, [location]);

  // Improved token extraction logic
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check all possible token locations
        let token = null;
        let type = null;
        
        // 1. Check hash fragment (hash format: #access_token=xyz&type=recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('access_token')) {
          token = hashParams.get('access_token');
          type = hashParams.get('type');
          console.log("Found token in hash fragment");
        }
        
        // 2. Check query params (query format: ?token=xyz&type=recovery)
        if (!token) {
          const queryParams = new URLSearchParams(window.location.search);
          if (queryParams.get('token')) {
            token = queryParams.get('token');
            type = queryParams.get('type');
            console.log("Found token in query params");
          }
        }
        
        // Special case: sometimes the token is embedded in the redirect URL
        // like /reset-password#some-data
        if (!token && window.location.hash && !hashParams.get('access_token')) {
          console.log("Found hash without params, trying to extract token manually");
          // This is a last resort attempt
          const hashContent = window.location.hash.substring(1);
          if (hashContent.length > 20) { // Arbitrary length check for a token
            try {
              // Try to use it as a token directly
              const { data: sessionData, error: sessionError } = await supabase.auth.getSessionFromUrl();
              if (sessionData.session) {
                console.log("Successfully extracted session from URL");
                setPageState('ready');
                return;
              } else {
                console.log("Failed to extract session from URL:", sessionError);
              }
            } catch (e) {
              console.error("Error trying to extract session from URL:", e);
            }
          }
        }
        
        // If we found a token through any method, attempt to use it
        if (token) {
          console.log("Setting session with token");
          // Attempt to set the session with the token
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: token,
          });
          
          if (error) {
            console.error("Error refreshing session:", error);
            
            // Fallback: try with setSession instead
            try {
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: '',
              });
              
              if (setSessionError) {
                console.error("Error setting session:", setSessionError);
                setPageState('invalid');
                return;
              } else {
                console.log("Session set successfully with fallback method");
                setPageState('ready');
                return;
              }
            } catch (e) {
              console.error("Exception in setSession fallback:", e);
              setPageState('invalid');
              return;
            }
          } else {
            console.log("Session refreshed successfully");
            setPageState('ready');
            return;
          }
        }
        
        // Last attempt: check if we already have a valid session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("Found existing valid session");
          setPageState('ready');
          return;
        }
        
        console.log("No valid token or session found");
        setPageState('invalid');
      } catch (error) {
        console.error("Error in checkSession:", error);
        setPageState('invalid');
      }
    };
    
    checkSession();
  }, []);

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
      console.log("Submitting password update");
      const { error, success } = await updatePassword(password);
      
      if (success) {
        console.log("Password updated successfully");
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
        console.error("Error updating password:", error);
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
            <button 
              onClick={() => navigate('/login')} 
              className="mt-4 btn-primary"
            >
              Return to Login
            </button>
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
