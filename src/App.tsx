
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster as SonnerToaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
import SurveyPreview from './pages/SurveyPreview';
import SurveyComplete from './pages/SurveyComplete';
import SurveyClosed from './pages/SurveyClosed';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import ResetPassword from './pages/ResetPassword';
import Improve from './pages/Improve';

import './App.css';

function App() {
  // Enhanced helper to check for auth codes and redirect appropriately
  const handleRoot = () => {
    // Check URL for code parameter (used by Supabase auth flows)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    // If there's a code, redirect to reset-password with the code
    if (code) {
      console.log('Auth code detected in URL, redirecting to reset-password');
      return <Navigate to={`/reset-password?code=${code}`} replace />;
    }
    
    // Otherwise, render the Index page
    return <Index />;
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={handleRoot()} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/email-confirmation" element={<EmailConfirmation />} />
          <Route path="/survey" element={<SurveyForm />} />
          <Route path="/survey-complete" element={<SurveyComplete />} />
          <Route path="/survey-closed" element={<SurveyClosed />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/improve" element={<Improve />} />
          
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
          <Route path="/survey-preview" element={
            <ProtectedRoute>
              <SurveyPreview />
            </ProtectedRoute>
          } />
          <Route path="/analysis" element={
            <ProtectedRoute>
              <Analysis />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <SonnerToaster closeButton position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
