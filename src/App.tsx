
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import NewSurvey from './pages/NewSurvey';
import SurveyForm from './pages/SurveyForm';
import Analysis from './pages/Analysis';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import SurveyComplete from './pages/SurveyComplete';
import SurveyClosed from './pages/SurveyClosed';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';

function App() {
  // Add page transitions
  useEffect(() => {
    document.body.classList.add('animate-fade-in');
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/new-survey" element={<NewSurvey />} />
          <Route path="/survey" element={<SurveyForm />} />
          <Route path="/survey-complete" element={<SurveyComplete />} />
          <Route path="/survey-closed" element={<SurveyClosed />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
