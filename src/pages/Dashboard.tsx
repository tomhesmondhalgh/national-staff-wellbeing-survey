
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Calendar, Users, Send } from 'lucide-react';
import { getRecentSurveys, getDashboardStats, SurveyWithResponses } from '../utils/surveyUtils';
import { format } from 'date-fns';

interface DashboardStats {
  totalSurveys: number;
  totalRespondents: number;
  responseRate: string;
  benchmarkScore: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSurveys, setRecentSurveys] = useState<SurveyWithResponses[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching dashboard data...");
        // Fetch stats
        const dashboardStats = await getDashboardStats();
        console.log("Dashboard stats:", dashboardStats);
        if (dashboardStats) {
          setStats(dashboardStats);
        }
        
        // Fetch recent surveys
        const surveys = await getRecentSurveys(3);
        console.log("Recent surveys:", surveys);
        setRecentSurveys(surveys);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Prepare stats data for display
  const statsData = stats ? [
    { 
      label: 'Total Surveys', 
      value: stats.totalSurveys.toString(), 
      icon: Calendar, 
      color: 'bg-green-100 text-green-600',
      link: '/surveys'
    },
    { 
      label: 'Total Respondents', 
      value: stats.totalRespondents.toString(), 
      icon: Users, 
      color: 'bg-blue-100 text-blue-600',
      link: null
    },
    { 
      label: 'Response Rate', 
      value: stats.responseRate, 
      icon: Send, 
      color: 'bg-purple-100 text-purple-600',
      link: null
    },
    { 
      label: 'Benchmark Score', 
      value: stats.benchmarkScore, 
      icon: BarChart, 
      color: 'bg-amber-100 text-amber-600',
      link: null
    },
  ] : [];

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

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="card p-6 animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statsData.map((stat, index) => {
              const StatContent = () => (
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  </div>
                </div>
              );
              
              return (
                <div 
                  key={index} 
                  className={`card p-6 hover:translate-y-[-4px] animate-slide-up ${stat.link ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {stat.link ? (
                    <Link to={stat.link} className="block w-full h-full">
                      <StatContent />
                    </Link>
                  ) : (
                    <StatContent />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Surveys */}
        <div className="card animate-slide-up [animation-delay:400ms]">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Surveys</h2>
          </div>
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="p-6 animate-pulse">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="mb-2 md:mb-0 w-1/2">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-10 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentSurveys.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSurveys.map((survey) => (
                <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="mb-2 md:mb-0">
                      <h3 className="text-md font-medium text-gray-900">{survey.name}</h3>
                      <p className="text-sm text-gray-500">Sent on {formatDate(survey.date)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {survey.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{survey.responses} responses</p>
                      </div>
                      <Link to={`/analysis?surveyId=${survey.id}`} className="btn-ghost py-1 px-3">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No surveys found. Create your first survey to get started.</p>
            </div>
          )}
          <div className="p-4 border-t border-gray-100 text-center">
            <Link to="/surveys" className="text-sm font-medium text-brandPurple-600 hover:text-brandPurple-700">
              View all surveys →
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
