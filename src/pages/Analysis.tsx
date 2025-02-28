
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getWellbeingScores, getTextResponses } from '../utils/analysisUtils';
import type { SurveyOption, QuestionResponse, TextResponse } from '../utils/analysisUtils';
import { cn } from '../lib/utils';

const Analysis = () => {
  // State for filters
  const [surveys, setSurveys] = useState<SurveyOption[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'month', 'quarter', 'year', 'custom'
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // State for analysis data
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendationScore, setRecommendationScore] = useState<{ score: number, nationalAverage: number }>({ score: 0, nationalAverage: 0 });
  const [leavingData, setLeavingData] = useState<{ name: string, value: number }[]>([]);
  const [wellbeingScores, setWellbeingScores] = useState<QuestionResponse[]>([]);
  const [textResponses, setTextResponses] = useState<{ doingWell: TextResponse[], improvements: TextResponse[] }>({ doingWell: [], improvements: [] });

  // Colors for pie chart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#6b7280'];
  
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
        const pieData = Object.entries(leavingContemplation).map(([name, value]) => ({ name, value }));
        setLeavingData(pieData);
        
        // Get wellbeing scores
        const scores = await getWellbeingScores(selectedSurvey, startDate, endDate);
        setWellbeingScores(scores);
        
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
  
  // Helper to customize tooltip on pie chart
  const customPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-gray-600">Count: {payload[0].value}</p>
          <p className="text-gray-600">
            Percentage: {((payload[0].value / leavingData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Enhanced tooltip for bar chart
  const customBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-md">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }} 
              />
              <p className="text-gray-700">
                <span className="font-medium">{entry.name}:</span> {entry.value}%
              </p>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            Difference: {Math.abs(payload[0].value - payload[1].value).toFixed(1)}%
            {payload[0].value > payload[1].value ? " above" : " below"} national average
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for the bars
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#FFFFFF" 
        textAnchor="middle" 
        dominantBaseline="middle"
        style={{ fontWeight: 'bold', fontSize: '12px', textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}
      >
        {value}%
      </text>
    );
  };

  // Transform each question into a format for individual chart
  const prepareChartData = (question: QuestionResponse) => {
    return [
      { 
        name: "Your Organization", 
        value: question.school 
      },
      { 
        name: "National Average", 
        value: question.national 
      }
    ];
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Survey Analysis" 
          subtitle="Compare your school's results with national benchmarks"
        />
        
        <div className="card p-6 mb-8 animate-slide-up">
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div>
              <label htmlFor="survey-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Survey
              </label>
              <select
                id="survey-select"
                className="form-input min-w-64"
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                disabled={loading}
              >
                <option value="">All Surveys</option>
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.name} ({survey.date})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="date-filter"
                className="form-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                disabled={loading}
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="form-input"
                    value={startDate.split('T')[0]}
                    onChange={(e) => setStartDate(`${e.target.value}T00:00:00Z`)}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="form-input"
                    value={endDate.split('T')[0]}
                    onChange={(e) => setEndDate(`${e.target.value}T23:59:59Z`)}
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-700">Loading analysis data...</span>
            </div>
          ) : (
            <>
              {/* Summary Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Recommendation Score Tile */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Score</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-bold text-indigo-600">{recommendationScore.score}/10</div>
                      <div className="text-sm text-gray-500 mt-2">Your Organization</div>
                    </div>
                    <div className="h-16 border-l border-gray-200 mx-6"></div>
                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-bold text-gray-400">{recommendationScore.nationalAverage}/10</div>
                      <div className="text-sm text-gray-500 mt-2">National Average</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Average score for "How likely are you to recommend this organisation to others as a great place to work?"
                  </p>
                </div>
                
                {/* Leaving Contemplation Pie Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Contemplating Leaving</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leavingData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {leavingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={customPieTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Responses to "In the last 6 months I have contemplated leaving my role"
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-4">Wellbeing Scores by Question</h3>
              
              {/* Individual charts for each question */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {wellbeingScores.map((question, index) => (
                  <div 
                    key={`chart-${index}`} 
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <h4 className="font-medium text-gray-900 mb-3 text-center">
                      {question.question}
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareChartData(question)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                          layout="horizontal"
                          barCategoryGap={50} // Space between category groups
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#4B5563' }}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            label={{ 
                              value: 'Percentage (%)', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <Tooltip content={customBarTooltip} />
                          <Bar 
                            dataKey="value" 
                            fill={index % 2 === 0 ? "#8b5cf6" : "#6366f1"} 
                            radius={[4, 4, 0, 0]} 
                            animationDuration={1500}
                            barSize={60} // Wider bars
                          >
                            <LabelList 
                              dataKey="value" 
                              position="top" 
                              formatter={(value: number) => `${value}%`}
                              style={{ 
                                fill: '#4B5563', 
                                fontSize: 14, 
                                fontWeight: 'bold' 
                              }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 text-center">
                      Difference: {Math.abs(question.school - question.national).toFixed(1)}% 
                      {question.school > question.national ? (
                        <span className="text-green-600"> above</span>
                      ) : (
                        <span className="text-red-600"> below</span>
                      )} national average
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Text Responses Section */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Open-ended Feedback</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What's Going Well */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      What does your organisation do well?
                    </h4>
                    {textResponses.doingWell.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {textResponses.doingWell.map((item, index) => (
                          <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                            <p className="text-gray-700">{item.response}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.created_at}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No responses available.</p>
                    )}
                  </div>
                  
                  {/* What Could Improve */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      What could your organisation do better?
                    </h4>
                    {textResponses.improvements.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {textResponses.improvements.map((item, index) => (
                          <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                            <p className="text-gray-700">{item.response}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.created_at}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No responses available.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Analysis;
