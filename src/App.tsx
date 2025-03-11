import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { Index } from './pages';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import CreateSurvey from './pages/CreateSurvey';
import EditSurvey from './pages/EditSurvey';
import SurveyResponses from './pages/SurveyResponses';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import NotFound from './pages/NotFound';
import TestingMode from './pages/TestingMode';
import TestingModeProvider from './contexts/TestingModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { StripeProvider } from './contexts/StripeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicSurveyForm from './pages/PublicSurveyForm';
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
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/surveys" element={<Surveys />} />
                  <Route path="/surveys/create" element={<CreateSurvey />} />
                  <Route path="/surveys/:id/edit" element={<EditSurvey />} />
                  <Route path="/surveys/:id/responses" element={<SurveyResponses />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/subscription" element={<Subscription />} />
                </Route>

                {/* Survey form routes - these are public but have their own access control */}
                <Route path="/s/:id" element={<PublicSurveyForm />} />
                <Route path="/s/:id/:responseId" element={<PublicSurveyForm />} />

                {/* Fallback route */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster />
            </StripeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </TestingModeProvider>
    </QueryClientProvider>
  );
};

export default App;
