
import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';

const EmailConfirmation = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [resending, setResending] = useState(false);
  
  // Extract email from location state or fallback to empty string
  const email = location.state?.email || '';
  
  // If user is already authenticated and confirmed, redirect to dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleResendEmail = async () => {
    setResending(true);
    // The actual resend functionality would be implemented here
    // For now we just simulate a delay
    setTimeout(() => {
      setResending(false);
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="page-container max-w-2xl mx-auto">
        <PageTitle 
          title="Confirm your email" 
          subtitle="Check your inbox and confirm your email address to continue"
        />
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Verification email sent</h2>
          {email ? (
            <p className="text-gray-600 mb-6">
              We've sent a verification email to <span className="font-medium">{email}</span>. 
              Click the link in the email to verify your account.
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              We've sent a verification email to your email address. 
              Click the link in the email to verify your account.
            </p>
          )}
          
          <Alert className="mb-6">
            <AlertDescription>
              Please check your spam or junk folder if you don't see the email in your inbox.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resending}
              className="flex items-center justify-center"
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
            
            <Button asChild variant="default">
              <Link to="/login">Return to login</Link>
            </Button>
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm">
          <p>
            Having trouble? Contact support at{' '}
            <a href="mailto:support@example.com" className="text-blue-500 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmailConfirmation;
