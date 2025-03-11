
import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import Team from './pages/Team';
import NotFound from './pages/NotFound';
import { TestingModeProvider } from './contexts/TestingModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { StripeProvider } from './contexts/StripeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import InvitationAccept from './pages/InvitationAccept';

const queryClient = new QueryClient();

const App = () => {
  const [isTestingMode, setIsTestingMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const testing = params.get('testing');
    setIsTestingMode(testing === 'true');
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TestingModeProvider>
          <AuthProvider>
            <OrganizationProvider>
              <StripeProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="/invitation/accept" element={<InvitationAccept />} />

                  {/* Protected routes */}
                  <Route element={<ProtectedRoute children={<></>} />}>
                    <Route path="/profile" element={<div>Profile Page</div>} />
                    <Route path="/dashboard" element={<div>Dashboard Page</div>} />
                    <Route path="/surveys" element={<div>Surveys Page</div>} />
                    <Route path="/surveys/create" element={<div>Create Survey Page</div>} />
                    <Route path="/surveys/:id/edit" element={<div>Edit Survey Page</div>} />
                    <Route path="/surveys/:id/responses" element={<div>Survey Responses Page</div>} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/settings" element={<div>Settings Page</div>} />
                    <Route path="/subscription" element={<div>Subscription Page</div>} />
                  </Route>

                  {/* Survey form routes - these are public but have their own access control */}
                  <Route path="/s/:id" element={<div>Public Survey Form</div>} />
                  <Route path="/s/:id/:responseId" element={<div>Public Survey Form with Response ID</div>} />

                  {/* Fallback route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                <Toaster />
              </StripeProvider>
            </OrganizationProvider>
          </AuthProvider>
        </TestingModeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
