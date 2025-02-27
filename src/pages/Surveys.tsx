
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyList from '../components/surveys/SurveyList';
import { toast } from "sonner";

const Surveys = () => {
  // Mock data for demonstration
  const [surveys, setSurveys] = useState([
    {
      id: 1,
      name: 'Spring Term 2023',
      date: 'March 10, 2023',
      status: 'Completed' as const,
      responseCount: 42,
      closeDate: 'March 24, 2023',
      url: 'https://example.com/survey/1'
    },
    {
      id: 2,
      name: 'Summer Term 2023',
      date: 'July 15, 2023',
      status: 'Completed' as const,
      responseCount: 38,
      closeDate: 'July 29, 2023',
      url: 'https://example.com/survey/2'
    },
    {
      id: 3,
      name: 'Autumn Term 2023',
      date: 'November 20, 2023',
      status: 'Sent' as const,
      responseCount: 24,
      closeDate: 'December 4, 2023',
      url: 'https://example.com/survey/3'
    },
    {
      id: 4,
      name: 'Spring Term 2024',
      date: 'January 5, 2024',
      status: 'Scheduled' as const,
      responseCount: 0,
      url: 'https://example.com/survey/4'
    }
  ]);

  const handleSendReminder = (id: number) => {
    // In a real application, you would send reminders here
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

        <SurveyList surveys={surveys} onSendReminder={handleSendReminder} />
      </div>
    </MainLayout>
  );
};

export default Surveys;
