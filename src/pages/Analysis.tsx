
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart, ReferenceLine } from 'recharts';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getDetailedWellbeingResponses } from '../utils/analysisUtils';
import type { SurveyOption, DetailedQuestionResponse, TextResponse } from '../utils/analysisUtils';
import { getTextResponses } from '../utils/analysisUtils';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';
import { cn } from '../lib/utils';

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
  const [recommendationScore, setRecommendationScore] = useState<{ score: number, nationalAverage: number }>({ score: 0, nationalAverage: 0 });
  const [leavingData, setLeavingData] = useState<{ name: string, value: number }[]>([]);
  const [detailedWellbeingResponses, setDetailedWellbeingResponses] = useState<DetailedQuestionResponse[]>([]);
  const [textResponses, setTextResponses] = useState<{ doingWell: TextResponse[], improvements: TextResponse[] }>({ doingWell: [], improvements: [] });

  // Colors for pie chart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#6b7280'];
  
  // Colors for stacked bar chart
  const RESPONSE_COLORS = {
    'Strongly Agree': '#10b981', // Green
    'Agree': '#6ee7b7', // Light green
    'Neutral': '#9ca3af', // Grey
    'Disagree': '#fca5a5', // Light red
    'Strongly Disagree': '#ef4444'  // Red
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
        const pieData = Object.entries(leavingContemplation).map(([name, value]) => ({ name, value }));
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

  // Enhanced tooltip for comparison chart
  const customComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const schoolData = payload.find((p: any) => p.name === "Your Organization");
      const nationalData = payload.find((p: any) => p.name === "National Average");
      
      const difference = schoolData && nationalData 
        ? (schoolData.value - nationalData.value).toFixed(1) 
        : "N/A";
      
      const isSignificant = Math.abs(Number(difference)) >= SIGNIFICANCE_THRESHOLD;
      
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md max-w-xs">
          <p className="font-medium text-gray-900 mb-3">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="mb-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.fill }} 
                />
                <p className="text-gray-700 font-medium">{entry.name}: {entry.value}%</p>
              </div>
            </div>
          ))}
          
          {schoolData && nationalData && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className={cn(
                "text-sm font-medium",
                Number(difference) > 0 ? "text-green-600" : Number(difference) < 0 ? "text-red-600" : "text-gray-600"
              )}>
                Difference: {difference > 0 ? "+" : ""}{difference}%
                {isSignificant && (
                  <span className="ml-1">
                    {Number(difference) > 0 ? "(Significantly above average)" : "(Significantly below average)"}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Enhanced tooltip for stacked bar chart
  const customStackedBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
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
        </div>
      );
    }
    return null;
  };

  // Helper to determine if a school score is significantly different from national average
  const getComparisonIndicator = (schoolScore: number, nationalScore: number) => {
    const difference = schoolScore - nationalScore;
    
    if (Math.abs(difference) < SIGNIFICANCE_THRESHOLD) {
      return (
        <div className="flex items-center text-gray-500">
          <MinusIcon size={16} className="mr-1" />
          <span>Similar to average</span>
        </div>
      );
    } else if (difference > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpIcon size={16} className="mr-1" />
          <span>Above average</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDownIcon size={16} className="mr-1" />
          <span>Below average</span>
        </div>
      );
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Survey Analysis" 
          subtitle="Compare your school's results with national benchmarks"
        />
        
        <div className="card p-6 mb-8 animate-slide-up">
          {/* Filters Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Data Filters</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label htmlFor="survey-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Survey
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
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-700">Loading analysis data...</span>
            </div>
          ) : (
            <>
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
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={[
                            { name: "Score", school: recommendationScore.score, national: recommendationScore.nationalAverage }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-md">
                                    <p className="text-gray-700">
                                      <span className="font-medium">Your Score:</span> {payload[0].value}/10
                                    </p>
                                    <p className="text-gray-700">
                                      <span className="font-medium">National Average:</span> {payload[1].value}/10
                                    </p>
                                    <p className="text-gray-700 mt-2">
                                      <span className="font-medium">Difference:</span> {(payload[0].value - payload[1].value).toFixed(1)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="school" fill="#4f46e5" name="Your Organization" barSize={60} />
                          <Bar dataKey="national" fill="#94a3b8" name="National Average" barSize={60} />
                          <ReferenceLine y={recommendationScore.nationalAverage} stroke="#94a3b8" strokeDasharray="3 3" />
                        </ComposedChart>
                      </ResponsiveContainer>
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
              </div>
              
              {/* Wellbeing Questions Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Wellbeing Indicators</h2>
                <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-indigo-600 mr-2"></div>
                      <span className="text-sm text-gray-700">Your Organization</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-400 mr-2"></div>
                      <span className="text-sm text-gray-700">National Average</span>
                    </div>
                    <div className="h-6 border-r border-gray-300 mx-2"></div>
                    {/* Significance indicators */}
                    <div className="flex items-center">
                      <div className="flex items-center text-green-600 mr-4">
                        <ArrowUpIcon size={16} className="mr-1" />
                        <span className="text-sm">Above average</span>
                      </div>
                      <div className="flex items-center text-gray-500 mr-4">
                        <MinusIcon size={16} className="mr-1" />
                        <span className="text-sm">Similar</span>
                      </div>
                      <div className="flex items-center text-red-600">
                        <ArrowDownIcon size={16} className="mr-1" />
                        <span className="text-sm">Below average</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 mb-8">
                  {detailedWellbeingResponses.map((question, index) => {
                    // Calculate the overall positive response (Agree + Strongly Agree)
                    const schoolPositive = (question.schoolResponses["Strongly Agree"] || 0) + 
                                          (question.schoolResponses["Agree"] || 0);
                    const nationalPositive = (question.nationalResponses["Strongly Agree"] || 0) + 
                                            (question.nationalResponses["Agree"] || 0);
                    
                    // Create data for the comparison chart
                    const comparisonData = [
                      {
                        name: question.question,
                        "Your Organization": schoolPositive,
                        "National Average": nationalPositive
                      }
                    ];
                    
                    // Create data for the detailed stacked chart
                    const chartData = [
                      {
                        name: "Your Organization",
                        "Strongly Agree": question.schoolResponses["Strongly Agree"] || 0,
                        "Agree": question.schoolResponses["Agree"] || 0,
                        "Neutral": question.schoolResponses["Neutral"] || 0,
                        "Disagree": question.schoolResponses["Disagree"] || 0,
                        "Strongly Disagree": question.schoolResponses["Strongly Disagree"] || 0,
                      },
                      {
                        name: "National Average",
                        "Strongly Agree": question.nationalResponses["Strongly Agree"] || 0,
                        "Agree": question.nationalResponses["Agree"] || 0,
                        "Neutral": question.nationalResponses["Neutral"] || 0,
                        "Disagree": question.nationalResponses["Disagree"] || 0,
                        "Strongly Disagree": question.nationalResponses["Strongly Disagree"] || 0,
                      }
                    ];
                    
                    return (
                      <div key={`chart-${index}`} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-md font-semibold text-gray-900">
                            {question.question}
                          </h4>
                          {getComparisonIndicator(schoolPositive, nationalPositive)}
                        </div>
                        
                        {/* Comparison Chart */}
                        <div className="h-24 mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={comparisonData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis 
                                type="number" 
                                domain={[0, 100]} 
                                tickFormatter={(value) => `${value}%`}
                              />
                              <YAxis type="category" dataKey="name" hide={true} />
                              <Tooltip content={customComparisonTooltip} />
                              <Legend verticalAlign="top" height={36} />
                              <Bar dataKey="Your Organization" fill="#4f46e5" barSize={20} />
                              <Bar dataKey="National Average" fill="#94a3b8" barSize={20} />
                              <ReferenceLine x={nationalPositive} stroke="#94a3b8" strokeDasharray="3 3" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Detailed Stacked Chart */}
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                              layout="horizontal"
                              barGap={25}
                              barCategoryGap="35%"
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: '#4B5563' }}
                              />
                              <YAxis 
                                type="number" 
                                domain={[0, 100]} 
                                tickFormatter={(value) => `${value}%`}
                                label={{ 
                                  value: 'Percentage (%)', 
                                  angle: -90, 
                                  position: 'insideLeft',
                                  style: { textAnchor: 'middle' }
                                }}
                              />
                              <Tooltip content={customStackedBarTooltip} />
                              <Legend verticalAlign="bottom" height={36} />
                              <Bar 
                                dataKey="Strongly Agree" 
                                stackId="a" 
                                fill={RESPONSE_COLORS['Strongly Agree']} 
                                name="Strongly Agree"
                              />
                              <Bar 
                                dataKey="Agree" 
                                stackId="a" 
                                fill={RESPONSE_COLORS['Agree']} 
                                name="Agree"
                              />
                              <Bar 
                                dataKey="Neutral" 
                                stackId="a" 
                                fill={RESPONSE_COLORS['Neutral']} 
                                name="Neutral"
                              />
                              <Bar 
                                dataKey="Disagree" 
                                stackId="a" 
                                fill={RESPONSE_COLORS['Disagree']} 
                                name="Disagree"
                              />
                              <Bar 
                                dataKey="Strongly Disagree" 
                                stackId="a" 
                                fill={RESPONSE_COLORS['Strongly Disagree']} 
                                name="Strongly Disagree"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
