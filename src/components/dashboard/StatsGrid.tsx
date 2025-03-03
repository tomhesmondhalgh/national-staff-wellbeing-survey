
import React from 'react';
import { BarChart, Calendar, Users, Send } from 'lucide-react';
import StatsCard from './StatsCard';

interface DashboardStats {
  totalSurveys: number;
  totalRespondents: number;
  responseRate: string;
  benchmarkScore: string;
}

interface StatsGridProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const StatsGrid = ({ stats, isLoading }: StatsGridProps) => {
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
      label: 'Would Recommend', 
      value: `${stats.benchmarkScore}/10`, 
      icon: BarChart, 
      color: 'bg-amber-100 text-amber-600',
      link: null
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card p-6 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          link={stat.link}
          delay={index * 100}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
