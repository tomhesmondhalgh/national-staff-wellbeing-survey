
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyList from '../components/surveys/SurveyList';
import Pagination from '../components/surveys/Pagination';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useMediaQuery } from '../hooks/use-media-query';
import { sendSurveyReminder } from '../utils/survey/sendReminder';

const SURVEYS_PER_PAGE = 10;

const Surveys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [canCreateSurveys, setCanCreateSurveys] = useState(false);
  const permissions = usePermissions();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const checkCreatePermission = async () => {
      if (permissions && !permissions.isLoading) {
        const canCreate = await permissions.canCreate();
        setCanCreateSurveys(canCreate);
      }
    };
    
    checkCreatePermission();
  }, [permissions]);

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Count surveys excluding Archived ones
        const { count, error: countError } = await supabase
          .from('survey_templates')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id)
          .neq('status', 'Archived');
          
        if (countError) {
          throw countError;
        }
        
        setTotalSurveys(count || 0);
        
        const from = (currentPage - 1) * SURVEYS_PER_PAGE;
        const to = from + SURVEYS_PER_PAGE - 1;
        
        // Fetch surveys excluding Archived ones
        const { data: surveyTemplates, error } = await supabase
          .from('survey_templates')
          .select(`
            id,
            name,
            date,
            close_date,
            created_at,
            emails,
            status,
            survey_responses(count)
          `)
          .eq('creator_id', user.id)
          .neq('status', 'Archived')
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (error) {
          throw error;
        }
        
        const formattedSurveys = surveyTemplates.map(template => {
          const now = new Date();
          const surveyDate = new Date(template.date);
          const closeDate = template.close_date ? new Date(template.close_date) : null;
          
          let status: 'Scheduled' | 'Sent' | 'Completed' = 'Scheduled';
          if (template.status) {
            status = template.status as any;
          } else if (surveyDate <= now) {
            status = closeDate && closeDate < now ? 'Completed' : 'Sent';
          }
          
          return {
            id: template.id,
            name: template.name,
            date: new Date(template.date).toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            status,
            responseCount: template.survey_responses.length > 0 ? template.survey_responses[0].count : 0,
            closeDate: template.close_date ? new Date(template.close_date).toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : undefined,
            url: `${window.location.origin}/survey?id=${template.id}`,
            formattedDate: new Date(template.date).toLocaleDateString('en-GB', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            closeDisplayDate: template.close_date ? 
              `Closes: ${new Date(template.close_date).toLocaleDateString('en-GB', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}` : 
              undefined,
            emails: template.emails || ''
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
  }, [user, currentPage]);

  const handleSendReminder = async (id: string) => {
    console.log(`Sending reminder for survey ${id}`);
    
    const success = await sendSurveyReminder(id);
    
    if (success) {
      toast.success("Reminder sent successfully!", {
        description: "Your staff will receive an email reminder shortly."
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(totalSurveys / SURVEYS_PER_PAGE);

  return (
    <MainLayout>
      <div className="page-container bg-white">
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} mb-8`}>
          <PageTitle 
            title="Surveys" 
            subtitle="Manage all your wellbeing surveys in one place"
            className={`mb-0 ${isMobile ? 'text-center' : 'text-left'}`}
          />
          {canCreateSurveys && (
            <Button onClick={() => navigate('/new-survey')}>
              <Plus className="mr-2 h-4 w-4" />
              New Survey
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading surveys...</p>
          </div>
        ) : (
          <>
            <SurveyList 
              surveys={surveys} 
              onSendReminder={handleSendReminder}
            />
            
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Surveys;
