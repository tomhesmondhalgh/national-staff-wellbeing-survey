
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { TestingModeProvider } from './contexts/TestingModeContext';
import { Toaster as SonnerToaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import EmailConfirmation from './pages/EmailConfirmation';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import NewSurvey from './pages/NewSurvey';
import EditSurvey from './pages/EditSurvey';
import SurveyForm from './pages/SurveyForm';
import SurveyComplete from './pages/SurveyComplete';
import SurveyClosed from './pages/SurveyClosed';
import Analysis from './pages/Analysis';
import Upgrade from './pages/Upgrade';
import Improve from './pages/Improve';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import CustomQuestions from './pages/CustomQuestions';
import Team from './pages/Team';
import InvitationAccept from './pages/InvitationAccept';

import './App.css';

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <OrganizationProvider>
            <TestingModeProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/survey" element={<SurveyForm />} />
                <Route path="/survey-complete" element={<SurveyComplete />} />
                <Route path="/survey-closed" element={<SurveyClosed />} />
                <Route path="/invitation/accept" element={<InvitationAccept />} />
                
                {/* Protected routes */}
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/surveys" element={
                  <ProtectedRoute>
                    <Surveys />
                  </ProtectedRoute>
                } />
                <Route path="/surveys/:id/edit" element={
                  <ProtectedRoute>
                    <EditSurvey />
                  </ProtectedRoute>
                } />
                <Route path="/new-survey" element={
                  <ProtectedRoute>
                    <NewSurvey />
                  </ProtectedRoute>
                } />
                <Route path="/analysis" element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } />
                <Route path="/upgrade" element={
                  <ProtectedRoute>
                    <Upgrade />
                  </ProtectedRoute>
                } />
                <Route path="/improve" element={
                  <ProtectedRoute>
                    <Improve />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/custom-questions" element={
                  <ProtectedRoute>
                    <CustomQuestions />
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute>
                    <Team />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <SonnerToaster closeButton position="bottom-right" />
            </TestingModeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
