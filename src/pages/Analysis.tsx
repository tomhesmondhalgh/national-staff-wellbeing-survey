import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getDetailedWellbeingResponses } from '../utils/analysisUtils';
import type { SurveyOption, DetailedQuestionResponse, TextResponse } from '../utils/analysisUtils';
import { getTextResponses } from '../utils/analysisUtils';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSurveySummary } from '../utils/summaryUtils';
import type { SummaryData } from '../utils/summaryUtils';

// Significance threshold (how much difference is considered significant)
const SIGNIFICANCE_THRESHOLD = 10; // percentage points

const Analysis = () => {
  // State for filters
  const [surveys, setSurveys] = useState<SurveyOption[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'month', 'quarter', 'year', 'custom'
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // State for analysis data
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendationScore, setRecommendationScore] = useState<{
    score: number;
    nationalAverage: number;
  }>({
    score: 0,
    nationalAverage: 0
  });
  const [leavingData, setLeavingData] = useState<{
    name: string;
    value: number;
  }[]>([]);
  const [detailedWellbeingResponses, setDetailedWellbeingResponses] = useState<DetailedQuestionResponse[]>([]);
  const [textResponses, setTextResponses] = useState<{
    doingWell: TextResponse[];
    improvements: TextResponse[];
  }>({
    doingWell: [],
    improvements: []
  });
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Colors for pie chart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#6b7280'];

  // Colors for stacked bar chart - removed Neutral as it's not an option
  const RESPONSE_COLORS = {
    'Strongly Agree': '#10b981',
    // Green
    'Agree': '#6ee7b7',
    // Light green
    'Disagree': '#fca5a5',
    // Light red
    'Strongly Disagree': '#ef4444' // Red
  };

  // Load surveys on component mount
  useEffect(() => {
    const loadSurveys = async () => {
      const options = await getSurveyOptions();
      setSurveys(options);
      if (options.length > 0) {
        setSelectedSurvey(options[0].id);
      }
      setLoading(false);
    };
    loadSurveys();
  }, []);

  // Calculate date range based on filter
  useEffect(() => {
    const now = new Date();
    let start = '';
    let end = now.toISOString();
    switch (dateFilter) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        break;
      case 'year':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        break;
      case 'custom':
        // Keep the manually set dates
        start = startDate;
        end = endDate;
        break;
      default:
        // 'all' - no date filtering
        start = '';
        end = '';
    }
    setStartDate(start);
    setEndDate(end);
  }, [dateFilter]);

  // Load analysis data when filters change
  useEffect(() => {
    const loadAnalysisData = async () => {
      setLoading(true);
      try {
        // Get recommendation score
        const recScore = await getRecommendationScore(selectedSurvey, startDate, endDate);
        setRecommendationScore(recScore);

        // Get leaving contemplation data
        const leavingContemplation = await getLeavingContemplation(selectedSurvey, startDate, endDate);
        const pieData = Object.entries(leavingContemplation).map(([name, value]) => ({
          name,
          value
        }));
        setLeavingData(pieData);

        // Get detailed wellbeing responses
        const detailedResponses = await getDetailedWellbeingResponses(selectedSurvey, startDate, endDate);
        setDetailedWellbeingResponses(detailedResponses);

        // Get text responses
        const responses = await getTextResponses(selectedSurvey, startDate, endDate);
        setTextResponses(responses);
      } catch (error) {
        console.error('Error loading analysis data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysisData();
  }, [selectedSurvey, startDate, endDate]);

  // Generate AI summary when data changes
  useEffect(() => {
    const generateSummary = async () => {
      if (loading || !selectedSurvey) return;
      setSummaryLoading(true);
      try {
        // Get the raw leaving contemplation data (not the pie chart format)
        const leavingContemplation = Object.fromEntries(leavingData.map(item => [item.name, item.value]));

        // Generate the summary
        const summary = await getSurveySummary(selectedSurvey, recommendationScore, leavingContemplation, detailedWellbeingResponses, textResponses);
        setSummaryData(summary);
      } catch (error) {
        console.error('Error generating summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };
    generateSummary();
  }, [selectedSurvey, loading, recommendationScore, leavingData, detailedWellbeingResponses, textResponses]);

  // Helper to customize tooltip on pie chart
  const customPieTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const total = leavingData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? (payload[0].value / total * 100).toFixed(1) : "0.0";
      return <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-gray-600">Count: {payload[0].value}</p>
          <p className="text-gray-600">
            Percentage: {percentage}%
          </p>
        </div>;
    }
    return null;
  };

  // Enhanced tooltip for stacked bar chart
  const customStackedBarTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => <div key={`tooltip-${index}`} className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full mr-2" style={{
            backgroundColor: entry.color
          }} />
              <p className="text-gray-700">
                <span className="font-medium">{entry.name}:</span> {entry.value}%
              </p>
            </div>)}
        </div>;
    }
    return null;
  };

  // Helper to determine if a school score is significantly different from national average
  const getComparisonIndicator = (schoolScore: number, nationalScore: number) => {
    const difference = schoolScore - nationalScore;
    if (Math.abs(difference) < SIGNIFICANCE_THRESHOLD) {
      return <div className="flex items-center justify-center text-gray-500">
          <MinusIcon size={14} className="mr-1" />
          <span className="text-sm">Similar to average</span>
        </div>;
    } else if (difference > 0) {
      return <div className="flex items-center justify-center text-green-600">
          <ArrowUpIcon size={14} className="mr-1" />
          <span className="text-sm">Above average</span>
        </div>;
    } else {
      return <div className="flex items-center justify-center text-red-600">
          <ArrowDownIcon size={14} className="mr-1" />
          <span className="text-sm">Below average</span>
        </div>;
    }
  };
  return <MainLayout>
      <div className="page-container">
        <PageTitle title="Survey Analysis" subtitle="Compare your school's results with national benchmarks" />
        
        <div className="card p-6 mb-8 animate-slide-up">
          {/* Filters Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Data Filters</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label htmlFor="survey-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Survey
                </label>
                <select id="survey-select" className="form-input min-w-64" value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)} disabled={loading}>
                  <option value="">All Surveys</option>
                  {surveys.map(survey => <option key={survey.id} value={survey.id}>
                      {survey.name} ({survey.date})
                    </option>)}
                </select>
              </div>
              
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select id="date-filter" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} disabled={loading}>
                  <option value="all">All Time</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {dateFilter === 'custom' && <>
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input id="start-date" type="date" className="form-input" value={startDate.split('T')[0]} onChange={e => setStartDate(`${e.target.value}T00:00:00Z`)} disabled={loading} />
                  </div>
                  
                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input id="end-date" type="date" className="form-input" value={endDate.split('T')[0]} onChange={e => setEndDate(`${e.target.value}T23:59:59Z`)} disabled={loading} />
                  </div>
                </>}
            </div>
          </div>
          
          {loading ? <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-700">Loading analysis data...</span>
            </div> : <>
              {/* AI Summary Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-xl font-bold text-gray-900">AI-Powered Summary</h2>
                  <div className="flex items-center text-indigo-600">
                    <Sparkles size={18} className="mr-1" />
                    <span className="text-sm font-medium">AI Analysis</span>
                  </div>
                </div>
                
                {summaryLoading ? <div className="flex items-center justify-center h-40 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
                    <span className="text-gray-700">Generating AI insights...</span>
                  </div> : summaryData?.insufficientData ? <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center h-40">
                    <div className="text-amber-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 text-center">Not enough data available for AI analysis. A minimum of 20 survey responses is required.</p>
                  </div> : summaryData ? <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <p className="text-gray-700 mb-6">{summaryData.introduction}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center text-xl my-[10px]">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          Areas of Strength
                        </h3>
                        <ul className="space-y-2">
                          {summaryData.strengths.map((strength, index) => <li key={`strength-${index}`} className="flex items-start my-[10px]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 text-left my-0">{strength}</span>
                            </li>)}
                        </ul>
                      </div>
                      
                      {/* Areas for Improvement */}
                      <div>
                        <h3 className="font-semibold text-amber-600 mb-3 flex items-center text-xl py-[10px] my-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {summaryData.improvements.map((improvement, index) => <li key={`improvement-${index}`} className="flex items-start my-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0">
                                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 text-left my-[5px] py-0">{improvement}</span>
                            </li>)}
                        </ul>
                      </div>
                    </div>
                  </div> : <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex items-center justify-center h-40">
                    <span className="text-gray-500">Unable to generate summary. Please try again later.</span>
                  </div>}
              </div>
              
              {/* Key Metrics Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recommendation Score Tile */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recommendation Score</h3>
                      {getComparisonIndicator(recommendationScore.score, recommendationScore.nationalAverage)}
                    </div>
                    <div className="flex items-center justify-center space-x-12 mt-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-indigo-600 mb-2">{recommendationScore.score}</div>
                        <div className="text-sm text-gray-500">Your School</div>
                      </div>
                      <div className="h-20 border-l border-gray-200"></div>
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-500 mb-2">{recommendationScore.nationalAverage}</div>
                        <div className="text-sm text-gray-500">National Average</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-8 text-center">
                      Average score for "How likely are you to recommend this organisation to others as a great place to work?" (0-10)
                    </p>
                  </div>
                  
                  {/* Leaving Contemplation Pie Chart */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Contemplating Leaving</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={leavingData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                        name,
                        percent
                      }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {leavingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={customPieTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Responses to "In the last 6 months I have contemplated leaving my role"
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Questions in a grid - removed heading and key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {detailedWellbeingResponses.map((question, index) => {
              // Calculate the overall positive response (Agree + Strongly Agree)
              const schoolPositive = (question.schoolResponses["Strongly Agree"] || 0) + (question.schoolResponses["Agree"] || 0);
              const nationalPositive = (question.nationalResponses["Strongly Agree"] || 0) + (question.nationalResponses["Agree"] || 0);

              // Create data for the detailed stacked chart
              const chartData = [{
                name: "Your School",
                "Strongly Agree": question.schoolResponses["Strongly Agree"] || 0,
                "Agree": question.schoolResponses["Agree"] || 0,
                "Disagree": question.schoolResponses["Disagree"] || 0,
                "Strongly Disagree": question.schoolResponses["Strongly Disagree"] || 0
              }, {
                name: "National Average",
                "Strongly Agree": question.nationalResponses["Strongly Agree"] || 0,
                "Agree": question.nationalResponses["Agree"] || 0,
                "Disagree": question.nationalResponses["Disagree"] || 0,
                "Strongly Disagree": question.nationalResponses["Strongly Disagree"] || 0
              }];
              return <div key={`chart-${index}`} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      {/* Question title takes full width and is center aligned */}
                      <h4 className="text-md font-semibold text-gray-900 mb-1 text-center">
                        {question.question}
                      </h4>
                      
                      {/* Comparison indicator is also center aligned below the question title */}
                      <div className="flex justify-center mb-4">
                        {getComparisonIndicator(schoolPositive, nationalPositive)}
                      </div>
                      
                      {/* Detailed Stacked Chart */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20
                    }} layout="horizontal" barGap={25} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
                            <XAxis dataKey="name" tick={{
                        fill: '#4B5563'
                      }} />
                            <YAxis type="number" domain={[0, 100]} tickFormatter={value => `${value}%`} label={{
                        value: 'Percentage (%)',
                        angle: -90,
                        position: 'insideLeft',
                        style: {
                          textAnchor: 'middle'
                        }
                      }} />
                            <Tooltip content={customStackedBarTooltip} />
                            {/* Smaller legend that fits on one line */}
                            <Legend verticalAlign="bottom" height={20} iconSize={10} wrapperStyle={{
                        fontSize: '10px'
                      }} />
                            <Bar dataKey="Strongly Agree" stackId="a" fill={RESPONSE_COLORS['Strongly Agree']} name="Strongly Agree" />
                            <Bar dataKey="Agree" stackId="a" fill={RESPONSE_COLORS['Agree']} name="Agree" />
                            <Bar dataKey="Disagree" stackId="a" fill={RESPONSE_COLORS['Disagree']} name="Disagree" />
                            <Bar dataKey="Strongly Disagree" stackId="a" fill={RESPONSE_COLORS['Strongly Disagree']} name="Strongly Disagree" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>;
            })}
              </div>
              
              {/* Text Responses Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Open-ended Feedback</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What's Going Well */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      What does your organisation do well?
                    </h4>
                    {textResponses.doingWell.length > 0 ? <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {textResponses.doingWell.map((item, index) => <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                            <p className="text-gray-700">{item.response}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.created_at}</p>
                          </div>)}
                      </div> : <p className="text-gray-500 italic">No responses available.</p>}
                  </div>
                  
                  {/* What Could Improve */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      What could your organisation do better?
                    </h4>
                    {textResponses.improvements.length > 0 ? <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {textResponses.improvements.map((item, index) => <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                            <p className="text-gray-700">{item.response}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.created_at}</p>
                          </div>)}
                      </div> : <p className="text-gray-500 italic">No responses available.</p>}
                  </div>
                </div>
              </div>
            </>}
        </div>
      </div>
    </MainLayout>;
};
export default Analysis;