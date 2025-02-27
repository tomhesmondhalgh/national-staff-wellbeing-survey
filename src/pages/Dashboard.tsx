
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Calendar, Users, Send } from 'lucide-react';

const Dashboard = () => {
  // Mock data for demonstration
  const stats = [
    { label: 'Total Surveys', value: '3', icon: Calendar, color: 'bg-green-100 text-green-600' },
    { label: 'Total Respondents', value: '124', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Response Rate', value: '87%', icon: Send, color: 'bg-purple-100 text-purple-600' },
    { label: 'Benchmark Score', value: '76%', icon: BarChart, color: 'bg-amber-100 text-amber-600' },
  ];

  const recentSurveys = [
    { id: 1, name: 'Spring Term 2023', date: 'March 10, 2023', responses: 42, status: 'Completed' },
    { id: 2, name: 'Summer Term 2023', date: 'July 15, 2023', responses: 38, status: 'Completed' },
    { id: 3, name: 'Autumn Term 2023', date: 'November 20, 2023', responses: 44, status: 'Completed' },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="card p-6 hover:translate-y-[-4px] animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Surveys */}
        <div className="card animate-slide-up [animation-delay:400ms]">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Surveys</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSurveys.map((survey) => (
              <div key={survey.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="mb-2 md:mb-0">
                    <h3 className="text-md font-medium text-gray-900">{survey.name}</h3>
                    <p className="text-sm text-gray-500">Sent on {survey.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {survey.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{survey.responses} responses</p>
                    </div>
                    <Link to={`/surveys/${survey.id}`} className="btn-ghost py-1 px-3">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
