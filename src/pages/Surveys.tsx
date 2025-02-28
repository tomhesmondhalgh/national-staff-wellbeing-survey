
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyList from '../components/surveys/SurveyList';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditSurvey from './EditSurvey';

const Surveys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<any[]>([]);

  // Check if we're on the main surveys page or a sub-route
  const isSubRoute = !!params.id;

  // If we're on a sub-route like /surveys/:id/edit, we'll render that component
  if (isSubRoute) {
    return (
      <Routes>
        <Route path=":id/edit" element={<EditSurvey />} />
      </Routes>
    );
  }

  // Fetch surveys from Supabase
  useEffect(() => {
    const fetchSurveys = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch survey templates created by the current user
        const { data: surveyTemplates, error } = await supabase
          .from('survey_templates')
          .select(`
            id,
            name,
            date,
            close_date,
            created_at,
            survey_responses(count)
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform the data for the SurveyList component
        const formattedSurveys = surveyTemplates.map(template => {
          const now = new Date();
          const surveyDate = new Date(template.date);
          const closeDate = template.close_date ? new Date(template.close_date) : null;
          
          // Determine survey status
          let status: 'Scheduled' | 'Sent' | 'Completed' = 'Scheduled';
          if (surveyDate <= now) {
            status = closeDate && closeDate < now ? 'Completed' : 'Sent';
          }
          
          // Make sure we're correctly passing the template.id as a string
          return {
            id: template.id,
            name: template.name,
            date: new Date(template.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            status,
            responseCount: template.survey_responses.length > 0 ? template.survey_responses[0].count : 0,
            closeDate: template.close_date ? new Date(template.close_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : undefined,
            url: `${window.location.origin}/survey?id=${template.id}`
          };
        });
        
        setSurveys(formattedSurveys);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        toast.error("Failed to load surveys", {
          description: "Please try refreshing the page."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [user]);

  const handleSendReminder = (id: string) => {
    // Updated to accept string IDs since Supabase uses UUIDs
    console.log(`Sending reminder for survey ${id}`);
    
    // Show toast notification
    toast.success("Reminder sent successfully!", {
      description: "Your staff will receive an email reminder shortly."
    });
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

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading surveys...</p>
          </div>
        ) : (
          <SurveyList surveys={surveys} onSendReminder={handleSendReminder} />
        )}
      </div>
    </MainLayout>
  );
};

export default Surveys;
