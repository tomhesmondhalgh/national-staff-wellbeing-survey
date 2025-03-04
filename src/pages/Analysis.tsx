import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getDetailedWellbeingResponses, getTextResponses } from '../utils/analysisUtils';
import { getSurveySummary } from '../utils/summaryUtils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import { Check, ArrowRight } from "lucide-react";

const SummarySection = ({ summary }: { summary: any }) => (
  <div className="mb-12">
    <h2 className="text-xl font-semibold mb-6 text-center">AI-Powered Summary</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-medium mb-4 text-green-600 flex items-center">
          <Check className="h-5 w-5 mr-2" /> Areas of Strength
        </h3>
        <ul className="space-y-3">
          {summary.strengths && summary.strengths.length > 0 ? (
            summary.strengths.map((strength: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs mr-2 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No strengths identified.</li>
          )}
        </ul>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4 text-amber-600 flex items-center">
          <ArrowRight className="h-5 w-5 mr-2" /> Areas for Improvement
        </h3>
        <ul className="space-y-3">
          {summary.improvements && summary.improvements.length > 0 ? (
            summary.improvements.map((improvement: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs mr-2 mt-0.5">•</span>
                <span>{improvement}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No improvements suggested.</li>
          )}
        </ul>
      </div>
    </div>
  </div>
);

const RecommendationScoreSection = ({ score, nationalAverage }: { score: number, nationalAverage: number }) => (
  <Card className="p-6">
    <h3 className="text-lg font-medium mb-4">Recommendation Score</h3>
    <div className="flex items-center justify-center space-x-12">
      <div className="text-center">
        <p className="text-4xl font-bold text-indigo-600">{score.toFixed(1)}</p>
        <p className="text-sm text-gray-500">Your score</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-500">{nationalAverage.toFixed(1)}</p>
        <p className="text-sm text-gray-500">National average</p>
      </div>
    </div>
    <p className="text-xs text-gray-500 text-center mt-4">
      Average score for "How likely would you recommend this organization to others as a place to work?" (0-10)
    </p>
  </Card>
);

const LeavingContemplationChart = ({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value,
  }));

  const COLORS = ['#4CAF50', '#8BC34A', '#FFC107', '#F44336'];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Staff Contemplating Leaving</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        Responses to: "I have considered leaving this organization in the past year"
      </p>
    </Card>
  );
};

const WellbeingQuestionChart = ({ 
  title, 
  data,
  subtitle 
}: { 
  title: string; 
  data: any;
  subtitle?: string;
}) => {
  const chartData = [
    {
      name: "Your School",
      "Strongly Disagree": data.schoolResponses?.["Strongly Disagree"] || 0,
      "Disagree": data.schoolResponses?.["Disagree"] || 0,
      "Agree": data.schoolResponses?.["Agree"] || 0,
      "Strongly Agree": data.schoolResponses?.["Strongly Agree"] || 0,
    },
    {
      name: "National Average",
      "Strongly Disagree": data.nationalResponses?.["Strongly Disagree"] || 0,
      "Disagree": data.nationalResponses?.["Disagree"] || 0,
      "Agree": data.nationalResponses?.["Agree"] || 0,
      "Strongly Agree": data.nationalResponses?.["Strongly Agree"] || 0,
    }
  ];

  return (
    <Card className="p-4">
      <h3 className="text-md font-medium mb-2">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            stackOffset="expand"
            barSize={30}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              width={100}
            />
            <Tooltip 
              formatter={(value, name) => [`${(Number(value) * 100).toFixed(0)}%`, name]} 
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              iconSize={8}
              layout="horizontal"
              verticalAlign="bottom"
            />
            <Bar dataKey="Strongly Disagree" stackId="a" fill="#FF5252" />
            <Bar dataKey="Disagree" stackId="a" fill="#FFA726" />
            <Bar dataKey="Agree" stackId="a" fill="#81C784" />
            <Bar dataKey="Strongly Agree" stackId="a" fill="#00C853" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const TextResponsesSection = ({ 
  doingWellResponses, 
  improvementResponses 
}: { 
  doingWellResponses: any[];
  improvementResponses: any[];
}) => (
  <div className="mt-12">
    <h2 className="text-xl font-semibold mb-6 text-center">Open-ended Feedback</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">What does your organization do well?</h3>
        {doingWellResponses.length > 0 ? (
          <ul className="space-y-3">
            {doingWellResponses.map((response, index) => (
              <li key={index} className="text-sm">
                {response.response}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No responses found.</p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">What could your organization do better?</h3>
        {improvementResponses.length > 0 ? (
          <ul className="space-y-3">
            {improvementResponses.map((response, index) => (
              <li key={index} className="text-sm">
                {response.response}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No responses found.</p>
        )}
      </Card>
    </div>
  </div>
);

const Analysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [surveyOptions, setSurveyOptions] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>("");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all-time");
  const [recommendationScore, setRecommendationScore] = useState({ score: 0, nationalAverage: 0 });
  const [leavingContemplation, setLeavingContemplation] = useState<Record<string, number>>({});
  const [detailedResponses, setDetailedResponses] = useState<any[]>([]);
  const [textResponses, setTextResponses] = useState({ doingWell: [], improvements: [] });
  const [summary, setSummary] = useState<any>({});
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    const loadSurveyOptions = async () => {
      try {
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

  useEffect(() => {
    const loadData = async () => {
      if (!selectedSurvey) return;

      try {
        setLoading(true);
        
        let startDate = "";
        let endDate = "";
        
        if (selectedTimeRange === "last-30-days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          startDate = thirtyDaysAgo.toISOString().split('T')[0];
        } else if (selectedTimeRange === "last-90-days") {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          startDate = ninetyDaysAgo.toISOString().split('T')[0];
        }
        
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
  }, [selectedSurvey, selectedTimeRange]);

  const handleSurveyChange = (value: string) => {
    setSelectedSurvey(value);
  };

  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
  };

  const getSurveyName = () => {
    const survey = surveyOptions.find(s => s.id === selectedSurvey);
    return survey ? survey.name : '';
  };

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Survey Analysis</h1>
          <p className="text-gray-600">Compare your school's results with national benchmarks</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Survey:</label>
            <Select 
              value={selectedSurvey} 
              onValueChange={handleSurveyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a survey" />
              </SelectTrigger>
              <SelectContent>
                {surveyOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} ({option.date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range:</label>
            <Select 
              value={selectedTimeRange} 
              onValueChange={handleTimeRangeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-4 items-end justify-end">
            <button className="py-2 px-4 border border-gray-300 rounded-md flex items-center text-sm text-gray-700">
              <span className="mr-2">📊</span> Export report
            </button>
            <button className="py-2 px-4 border border-gray-300 rounded-md flex items-center text-sm text-gray-700">
              <span className="mr-2">🖨️</span> Download PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            <SummarySection summary={summary} />

            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-center">Survey Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RecommendationScoreSection 
                  score={recommendationScore.score} 
                  nationalAverage={recommendationScore.nationalAverage} 
                />
                <LeavingContemplationChart data={leavingContemplation} />
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-center">Wellbeing Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {detailedResponses.map((question, index) => (
                  <WellbeingQuestionChart 
                    key={index} 
                    title={question.question}
                    data={question}
                    subtitle="Stacked to 100%"
                  />
                ))}
              </div>
            </div>

            <TextResponsesSection
              doingWellResponses={textResponses.doingWell}
              improvementResponses={textResponses.improvements}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Analysis;
