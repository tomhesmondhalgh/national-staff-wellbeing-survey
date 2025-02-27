
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyList from '../components/surveys/SurveyList';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { getSurveys, updateSurvey, deleteSurvey, Survey } from '../lib/db';
import { Loader2 } from 'lucide-react';

const Surveys = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSurveys = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const data = await getSurveys(user.id);
        setSurveys(data);
      } catch (error) {
        console.error('Error loading surveys:', error);
        toast.error('Failed to load surveys');
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveys();
  }, [user]);

  const handleSendReminder = async (id: number) => {
    if (!user) return;
    
    try {
      // In a real app, you would send emails here
      // For now, we'll just update the status in the database

      await updateSurvey(id, { status: 'Sent' }, user.id);
      
      // Update local state
      setSurveys(surveys.map(survey => 
        survey.id === id ? { ...survey, status: 'Sent' } : survey
      ));
      
      // Show toast notification
      toast.success("Reminder sent successfully!", {
        description: "Your staff will receive an email reminder shortly."
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!user) return;
    
    try {
      const result = await deleteSurvey(id, user.id);
      
      if (result.success) {
        // Remove from local state
        setSurveys(surveys.filter(survey => survey.id !== id));
        
        toast.success("Survey deleted successfully");
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('Failed to delete survey');
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-8">
          <PageTitle 
            title="Surveys" 
            subtitle="Manage all your wellbeing surveys in one place"
            className="mb-0 text-left"
          />
          <Link to="/new-survey" className="btn-primary">
            New Survey
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={30} className="animate-spin text-brandPurple-600" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="card p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No surveys yet</h3>
            <p className="text-gray-500 mb-6">Create your first survey to get started</p>
            <Link to="/new-survey" className="btn-primary">
              Create Survey
            </Link>
          </div>
        ) : (
          <SurveyList 
            surveys={surveys} 
            onSendReminder={handleSendReminder} 
            onDeleteSurvey={handleDeleteSurvey}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Surveys;
