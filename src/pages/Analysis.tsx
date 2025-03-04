import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getDetailedWellbeingResponses, getTextResponses } from '../utils/analysisUtils';
import { getSurveySummary } from '../utils/summaryUtils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const WellbeingChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="question" />
      <YAxis tickFormatter={(value) => `${value}%`} />
      <Tooltip formatter={(value) => `${value}%`} />
      <Legend />
      <Bar dataKey="schoolResponses.Strongly Agree" stackId="a" fill="#82ca9d" name="Strongly Agree" />
      <Bar dataKey="schoolResponses.Agree" stackId="a" fill="#8884d8" name="Agree" />
      <Bar dataKey="schoolResponses.Disagree" stackId="a" fill="#ffc658" name="Disagree" />
      <Bar dataKey="schoolResponses.Strongly Disagree" stackId="a" fill="#ff7373" name="Strongly Disagree" />
    </BarChart>
  </ResponsiveContainer>
);

const LeavingContemplationChart = ({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" name="Responses" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const TextResponses = ({ title, responses }: { title: string, responses: any[] }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {responses.length > 0 ? (
      <ul>
        {responses.map((response, index) => (
          <li key={index} className="mb-2 p-3 rounded-md bg-gray-50 border border-gray-100">
            <p className="text-gray-800">{response.response}</p>
            <p className="text-sm text-gray-500 mt-1">Submitted on: {response.created_at}</p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500">No responses found.</p>
    )}
  </div>
);

const SummarySection = ({ summary }: { summary: any }) => (
  <div>
    <h2 className="text-2xl font-semibold mb-4">AI Generated Summary</h2>
    {summary.insufficientData ? (
      <p className="text-gray-500">Insufficient data to generate a summary.</p>
    ) : (
      <>
        {summary.introduction && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Introduction</h3>
            <p className="text-gray-800">{summary.introduction}</p>
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Strengths</h3>
          {summary.strengths && summary.strengths.length > 0 ? (
            <ul className="list-disc list-inside text-gray-800">
              {summary.strengths.map((strength: string, index: number) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No strengths identified.</p>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Improvements</h3>
          {summary.improvements && summary.improvements.length > 0 ? (
            <ul className="list-disc list-inside text-gray-800">
              {summary.improvements.map((improvement: string, index: number) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No improvements suggested.</p>
          )}
        </div>
      </>
    )}
  </div>
);

const Analysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveyOptions, setSurveyOptions] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [recommendationScore, setRecommendationScore] = useState({ score: 0, nationalAverage: 0 });
  const [leavingContemplation, setLeavingContemplation] = useState<Record<string, number>>({});
  const [detailedResponses, setDetailedResponses] = useState<any[]>([]);
  const [textResponses, setTextResponses] = useState({ doingWell: [], improvements: [] });
  const [summary, setSummary] = useState<any>({});
  const [noData, setNoData] = useState(false);

  // Function to load survey options
  useEffect(() => {
    const loadSurveyOptions = async () => {
      try {
        // Now passing the user ID to filter surveys by creator
        const options = await getSurveyOptions(user?.id);
        setSurveyOptions(options);
        
        if (options.length > 0) {
          setSelectedSurvey(options[0].id);
        } else {
          setNoData(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading survey options:', error);
        toast.error("Failed to load surveys");
      }
    };

    if (user) {
      loadSurveyOptions();
    }
  }, [user]);

  // Function to load data based on selected survey and date range
  useEffect(() => {
    const loadData = async () => {
      if (!selectedSurvey) return;

      try {
        setLoading(true);
        const [
          recommendationScoreData,
          leavingContemplationData,
          detailedResponsesData,
          textResponsesData,
        ] = await Promise.all([
          getRecommendationScore(selectedSurvey, startDate, endDate),
          getLeavingContemplation(selectedSurvey, startDate, endDate),
          getDetailedWellbeingResponses(selectedSurvey, startDate, endDate),
          getTextResponses(selectedSurvey, startDate, endDate),
        ]);

        setRecommendationScore(recommendationScoreData);
        setLeavingContemplation(leavingContemplationData);
        setDetailedResponses(detailedResponsesData);
        setTextResponses(textResponsesData);

        // Load survey summary
        const summaryData = await getSurveySummary(
          selectedSurvey,
          recommendationScoreData,
          leavingContemplationData,
          detailedResponsesData,
          textResponsesData
        );
        setSummary(summaryData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Failed to load data for selected survey");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSurvey, startDate, endDate]);

  // Function to handle survey selection
  const handleSurveyChange = (e: any) => {
    setSelectedSurvey(e.target.value);
  };

  // Function to handle date range selection
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start) {
      setStartDate(start.toISOString().split('T')[0]);
    } else {
      setStartDate("");
    }
    if (end) {
      setEndDate(end.toISOString().split('T')[0]);
    } else {
      setEndDate("");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No Date Selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Empty state rendering when no surveys found
  if (noData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <PageTitle 
            title="Analysis" 
            subtitle="View insights from your wellbeing surveys"
          />
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">No surveys found</h2>
            <p className="text-gray-600 mb-6">You haven't created any surveys yet or no responses have been collected.</p>
            <button
              onClick={() => navigate('/new-survey')}
              className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white font-medium py-2 px-6 rounded-md transition-all duration-200"
            >
              Create Your First Survey
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Analysis" 
          subtitle="View insights from your wellbeing surveys"
        />

        <div className="mb-8 flex items-center space-x-4">
          <div>
            <label htmlFor="surveySelect" className="block text-sm font-medium text-gray-700">Select Survey:</label>
            <select
              id="surveySelect"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brandPurple-500 focus:border-brandPurple-500 sm:text-sm rounded-md"
              value={selectedSurvey}
              onChange={handleSurveyChange}
              disabled={loading}
            >
              {surveyOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Date Range:</label>
            <DatePicker
              selectsRange
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              onChange={handleDateRangeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brandPurple-500 focus:border-brandPurple-500 sm:text-sm rounded-md"
              placeholderText="Select Date Range"
            />
            {startDate || endDate ? (
              <p className="text-sm text-gray-500 mt-1">
                {startDate ? formatDate(startDate) : 'Start Date'} - {endDate ? formatDate(endDate) : 'End Date'}
              </p>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recommendation Score</h2>
                <p className="text-3xl font-bold text-brandPurple-600">{recommendationScore.score}</p>
                <p className="text-gray-500">National Average: {recommendationScore.nationalAverage}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Leaving Contemplation</h2>
                <LeavingContemplationChart data={leavingContemplation} />
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Detailed Wellbeing Responses</h2>
                <WellbeingChart data={detailedResponses} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <TextResponses title="What is the organisation doing well?" responses={textResponses.doingWell} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <TextResponses title="What could the organisation do to improve?" responses={textResponses.improvements} />
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <SummarySection summary={summary} />
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Analysis;
