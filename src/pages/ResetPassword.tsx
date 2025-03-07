
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

  useEffect(() => {
    const checkSession = async () => {
      console.log("Reset Password Page Loaded");
      console.log("Current URL:", window.location.href);
      
      try {
        // Check if we have a "code" parameter in the URL (PKCE flow)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        
        if (code) {
          console.log("Auth code found in URL:", code);
          
          try {
            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error("Error exchanging code for session:", error);
              setPageState('invalid');
              return;
            }
            
            if (data.session) {
              console.log("Successfully created session from code");
              setPageState('ready');
              return;
            }
          } catch (error) {
            console.error("Error processing code:", error);
            setPageState('invalid');
            return;
          }
        } else {
          console.log("No code parameter found, checking for existing session");
        }
        
        // If we didn't find a code or couldn't process it, check for an existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log("Session found:", sessionData.session.user.id);
          setPageState('ready');
        } else {
          console.log("No session found");
          
          // Check for other auth parameters in the URL that might not have been processed
          const hasAuthParams = 
            window.location.hash.includes('access_token') || 
            window.location.search.includes('token=');
            
          if (hasAuthParams) {
            console.log("Auth parameters found in URL, attempting to process manually");
            
            try {
              // Let Supabase try to process the URL parameters
              await supabase.auth.getUser();
              
              // Check again for session
              const { data: refreshedSession } = await supabase.auth.getSession();
              if (refreshedSession.session) {
                console.log("Successfully created session from URL parameters");
                setPageState('ready');
              } else {
                console.log("Failed to create session from URL parameters");
                setPageState('invalid');
              }
            } catch (error) {
              console.error("Error processing URL auth:", error);
              setPageState('invalid');
            }
          } else {
            console.log("No auth parameters found in URL");
            setPageState('invalid');
          }
        }
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
        description: error.message || 'Please try again or request a new reset link'
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
