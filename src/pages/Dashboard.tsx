
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { getRecentSurveys, getDashboardStats, SurveyWithResponses } from '../utils/surveyUtils';
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentSurveysList from '../components/dashboard/RecentSurveysList';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalSurveys: number;
  totalRespondents: number;
  responseRate: string;
  benchmarkScore: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSurveys, setRecentSurveys] = useState<SurveyWithResponses[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching dashboard data...");
        const dashboardStats = await getDashboardStats();
        console.log("Dashboard stats:", dashboardStats);
        if (dashboardStats) {
          setStats(dashboardStats);
        }
        
        // Pass the current user's ID to getRecentSurveys
        const surveys = await getRecentSurveys(3, user.id);
        console.log("Recent surveys:", surveys);
        setRecentSurveys(surveys);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-8">
          <PageTitle 
            title="Dashboard" 
            subtitle="Welcome back, view your survey insights at a glance"
            className="mb-0 text-left"
          />
          <Link to="/new-survey" className="btn-primary">
            New Survey
          </Link>
        </div>

        <StatsGrid stats={stats} isLoading={isLoading} />

        <div className="card animate-slide-up [animation-delay:400ms]">
          <div className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Surveys</h2>
            <Link to="/surveys" className="text-sm font-medium text-brandPurple-600 hover:text-brandPurple-700">
              View all surveys →
            </Link>
          </div>
          
          <RecentSurveysList surveys={recentSurveys} isLoading={isLoading} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
