
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster as SonnerToaster } from 'sonner';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import NewSurvey from './pages/NewSurvey';
import EditSurvey from './pages/EditSurvey';
import SurveyForm from './pages/SurveyForm';
import SurveyComplete from './pages/SurveyComplete';
import SurveyClosed from './pages/SurveyClosed';
import Analysis from './pages/Analysis';
import NotFound from './pages/NotFound';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/surveys/:id/edit" element={<EditSurvey />} />
          <Route path="/new-survey" element={<NewSurvey />} />
          <Route path="/survey" element={<SurveyForm />} />
          <Route path="/survey-complete" element={<SurveyComplete />} />
          <Route path="/survey-closed" element={<SurveyClosed />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <SonnerToaster closeButton position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
