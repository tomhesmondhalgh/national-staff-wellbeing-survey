import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSurveyOptions, getRecommendationScore, getLeavingContemplation, getDetailedWellbeingResponses, getCustomQuestionAnalysisResults } from '../utils/analysisUtils';
import type { SurveyOption, DetailedQuestionResponse, TextResponse } from '../utils/analysisUtils';
import { getTextResponses } from '../utils/analysisUtils';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon, ChevronLeft, ChevronRight, Mail, Download, CalendarIcon, FilterIcon, BarChart4Icon } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSurveySummary } from '../utils/summaryUtils';
import type { SummaryData } from '../utils/summaryUtils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { generatePDF, sendReportByEmail } from '../utils/reportUtils';
import { useToast } from '../hooks/use-toast';
import { CustomQuestionResults } from '../components/analysis';
import { Separator } from '../components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';

const SIGNIFICANCE_THRESHOLD = 10;
const RESPONSES_PER_PAGE = 5;

const Analysis = () => {
  const [surveys, setSurveys] = useState<SurveyOption[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
  const [customQuestionResults, setCustomQuestionResults] = useState<any[]>([]);

  const [doingWellPage, setDoingWellPage] = useState<number>(1);
  const [improvementsPage, setImprovementsPage] = useState<number>(1);

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#6b7280'];

  const RESPONSE_COLORS = {
    'Strongly Agree': '#10b981',
    'Agree': '#6ee7b7',
    'Disagree': '#fca5a5',
    'Strongly Disagree': '#ef4444'
  };

  const analysisRef = useRef<HTMLDivElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState<boolean>(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const { toast } = useToast();

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
        start = startDate;
        end = endDate;
        break;
      default:
        start = '';
        end = '';
    }
    setStartDate(start);
    setEndDate(end);
  }, [dateFilter]);

  useEffect(() => {
    const loadAnalysisData = async () => {
      setLoading(true);
      try {
        const recScore = await getRecommendationScore(selectedSurvey, startDate, endDate);
        setRecommendationScore(recScore);

        const leavingContemplation = await getLeavingContemplation(selectedSurvey, startDate, endDate);
        const pieData = Object.entries(leavingContemplation).map(([name, value]) => ({
          name,
          value
        }));
        setLeavingData(pieData);

        const detailedResponses = await getDetailedWellbeingResponses(selectedSurvey, startDate, endDate);
        setDetailedWellbeingResponses(detailedResponses);

        const responses = await getTextResponses(selectedSurvey, startDate, endDate);
        setTextResponses(responses);

        // Load custom question results
        const customResults = await getCustomQuestionAnalysisResults(selectedSurvey);
        setCustomQuestionResults(customResults);
      } catch (error) {
        console.error('Error loading analysis data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysisData();
  }, [selectedSurvey, startDate, endDate]);

  useEffect(() => {
    const generateSummary = async () => {
      if (loading || !selectedSurvey) return;
      setSummaryLoading(true);
      try {
        const leavingContemplation = Object.fromEntries(leavingData.map(item => [item.name, item.value]));

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

  const customPieTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const total = leavingData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? (payload[0].value / total * 100).toFixed(1) : "0.0";
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-gray-600">Count: {payload[0].value}</p>
          <p className="text-gray-600">
            Percentage: {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const customStackedBarTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{
                  backgroundColor: entry.color
                }} 
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

  const getComparisonIndicator = (schoolScore: number, nationalScore: number) => {
    const difference = schoolScore - nationalScore;
    if (Math.abs(difference) < SIGNIFICANCE_THRESHOLD) {
      return (
        <div className="flex items-center justify-center text-gray-500">
          <MinusIcon size={14} className="mr-1" />
          <span className="text-sm">Similar to average</span>
        </div>
      );
    } else if (difference > 0) {
      return (
        <div className="flex items-center justify-center text-green-600">
          <ArrowUpIcon size={14} className="mr-1" />
          <span className="text-sm">Above average</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center text-red-600">
          <ArrowDownIcon size={14} className="mr-1" />
          <span className="text-sm">Below average</span>
        </div>
      );
    }
  };

  const getPaginatedResponses = (responses: TextResponse[], page: number) => {
    const startIndex = (page - 1) * RESPONSES_PER_PAGE;
    return responses.slice(startIndex, startIndex + RESPONSES_PER_PAGE);
  };

  const getTotalPages = (responses: TextResponse[]) => {
    return Math.max(1, Math.ceil(responses.length / RESPONSES_PER_PAGE));
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void 
  }) => {
    return (
      <div className="flex items-center justify-center mt-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <span className="text-sm text-gray-600">
          {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    );
  };

  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEmailSending(true);
      
      const selectedSurveyName = surveys.find(s => s.id === selectedSurvey)?.name || 'Survey Analysis';
      
      await sendReportByEmail(
        emailAddress,
        selectedSurvey,
        selectedSurveyName,
        summaryData,
        recommendationScore,
        leavingData,
        detailedWellbeingResponses,
        textResponses
      );
      
      setEmailDialogOpen(false);
      setEmailAddress('');
      
      toast({
        title: "Email Sent",
        description: `Report has been sent to ${emailAddress}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send the report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      
      const selectedSurveyName = surveys.find(s => s.id === selectedSurvey)?.name || 'survey';
      const fileName = `${selectedSurveyName.toLowerCase().replace(/\s+/g, '-')}-analysis.pdf`;
      
      await generatePDF(analysisRef, fileName);
      
      toast({
        title: "PDF Generated",
        description: "Report has been downloaded as PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle title="Survey Analysis" subtitle="Compare your school's results with national benchmarks" />
        
        <div className="card p-6 mb-8 animate-slide-up">
          {/* Redesigned filters and action buttons section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex flex-col md:flex-row items-stretch">
              {/* Filters section with visual indicator */}
              <div className="bg-[#F1F0FB] p-5 flex-grow md:max-w-[70%]">
                <div className="flex items-center gap-2 mb-4 text-[#403E43]">
                  <FilterIcon size={18} />
                  <h3 className="text-md font-semibold">Data Filters</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Survey selection */}
                  <div>
                    <label htmlFor="survey-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Survey
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BarChart4Icon size={16} className="text-gray-400" />
                      </div>
                      <select 
                        id="survey-select" 
                        className="form-input pl-10 w-full" 
                        value={selectedSurvey} 
                        onChange={e => setSelectedSurvey(e.target.value)} 
                        disabled={loading}
                      >
                        <option value="">All Surveys</option>
                        {surveys.map(survey => (
                          <option key={survey.id} value={survey.id}>
                            {survey.name} ({survey.date})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon size={16} className="text-gray-400" />
                      </div>
                      <select 
                        id="date-filter" 
                        className="form-input pl-10 w-full" 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                        disabled={loading}
                      >
                        <option value="all">All Time</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                        <option value="year">Last Year</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Custom date inputs */}
                  {dateFilter === 'custom' && (
                    <>
                      <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                                disabled={loading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(new Date(startDate), 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={startDate ? new Date(startDate) : undefined}
                                onSelect={(date) => date && setStartDate(date.toISOString())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                                disabled={loading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(new Date(endDate), 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={endDate ? new Date(endDate) : undefined}
                                onSelect={(date) => date && setEndDate(date.toISOString())}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Vertical separator */}
              <div className="hidden md:block">
                <Separator orientation="vertical" className="h-full bg-gray-200" />
              </div>
              
              {/* Action buttons section */}
              <div className="p-5 flex flex-col justify-center md:w-[30%] space-y-3 bg-[#F6F6F7]">
                <h3 className="text-md font-semibold text-[#403E43] mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                  Report Actions
                </h3>
                
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full py-2 px-4 bg-white hover:bg-[#D3E4FD] border border-gray-200 transition-all duration-300 shadow-sm"
                      disabled={loading}
                    >
                      <Mail className="mr-2 h-4 w-4 text-[#0EA5E9]" />
                      Email Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Email Analysis Report</DialogTitle>
                      <DialogDescription>
                        Enter an email address to send this analysis report to.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="secondary" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSendEmail} disabled={isEmailSending}>
                        {isEmailSending ? "Sending..." : "Send Report"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  className="w-full py-2 px-4 bg-white hover:bg-[#D3E4FD] border border-gray-200 transition-all duration-300 shadow-sm"
                  onClick={handleDownloadPdf} 
                  disabled={loading || isPdfGenerating}
                >
                  <Download className="mr-2 h-4 w-4 text-[#0EA5E9]" />
                  {isPdfGenerating ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-700">Loading analysis data...</span>
            </div>
          ) : (
            <div ref={analysisRef}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-xl text-gray-900 text-center font-bold w-full">AI-Powered Summary</h2>
                </div>
                
                {summaryLoading ? (
                  <div className="flex items-center justify-center h-40 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
                    <span className="text-gray-700">Generating AI insights...</span>
                  </div>
                ) : summaryData?.insufficientData ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center h-40">
                    <div className="text-amber-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 text-center">Not enough data available for AI analysis. A minimum of 20 survey responses is required.</p>
                  </div>
                ) : summaryData ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center text-xl my-[10px]">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          Areas of Strength
                        </h3>
                        <ul className="space-y-2">
                          {summaryData.strengths.map((strength, index) => (
                            <li key={`strength-${index}`} className="flex items-start my-[10px]">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 text-left my-0">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-amber-600 mb-3 flex items-center text-xl py-[10px] my-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {summaryData.improvements.map((improvement, index) => (
                            <li key={`improvement-${index}`} className="flex items-start my-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0">
                                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700 text-left my-[5px] py-0">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex items-center justify-center h-40">
                    <span className="text-gray-500">Unable to generate summary. Please try again later.</span>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Survey Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            label={({
                              name,
                              percent
                            }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {leavingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {detailedWellbeingResponses.map((question, index) => {
                  const schoolPositive = (question.schoolResponses["Strongly Agree"] || 0) + (question.schoolResponses["Agree"] || 0);
                  const nationalPositive = (question.nationalResponses["Strongly Agree"] || 0) + (question.nationalResponses["Agree"] || 0);

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
                  
                  return (
                    <div key={`chart-${index}`} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h4 className="text-md font-semibold text-gray-900 mb-1 text-center">
                        {question.question}
                      </h4>
                      
                      <div className="flex justify-center mb-4">
                        {getComparisonIndicator(schoolPositive, nationalPositive)}
                      </div>
                      
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip content={customStackedBarTooltip} />
                            <Legend />
                            <Bar dataKey="Strongly Agree" stackId="a" fill={RESPONSE_COLORS['Strongly Agree']} />
                            <Bar dataKey="Agree" stackId="a" fill={RESPONSE_COLORS['Agree']} />
                            <Bar dataKey="Disagree" stackId="a" fill={RESPONSE_COLORS['Disagree']} />
                            <Bar dataKey="Strongly Disagree" stackId="a" fill={RESPONSE_COLORS['Strongly Disagree']} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {customQuestionResults.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Custom Question Results</h2>
                  <CustomQuestionResults results={customQuestionResults} />
                </div>
              )}
              
              {textResponses.doingWell.length > 0 || textResponses.improvements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {textResponses.doingWell.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                        </svg>
                        Doing Well
                      </h3>
                      
                      <div className="space-y-4">
                        {getPaginatedResponses(textResponses.doingWell, doingWellPage).map((response, index) => (
                          <div key={`doing-well-${index}`} className="p-3 bg-gray-50 rounded-md">
                            <p className="text-gray-700">{response.response}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {response.created_at && <span>{new Date(response.created_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {textResponses.doingWell.length > RESPONSES_PER_PAGE && (
                        <PaginationControls 
                          currentPage={doingWellPage} 
                          totalPages={getTotalPages(textResponses.doingWell)} 
                          onPageChange={setDoingWellPage} 
                        />
                      )}
                    </div>
                  )}
                  
                  {textResponses.improvements.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Could Improve
                      </h3>
                      
                      <div className="space-y-4">
                        {getPaginatedResponses(textResponses.improvements, improvementsPage).map((response, index) => (
                          <div key={`improvement-${index}`} className="p-3 bg-gray-50 rounded-md">
                            <p className="text-gray-700">{response.response}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {response.created_at && <span>{new Date(response.created_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {textResponses.improvements.length > RESPONSES_PER_PAGE && (
                        <PaginationControls 
                          currentPage={improvementsPage} 
                          totalPages={getTotalPages(textResponses.improvements)} 
                          onPageChange={setImprovementsPage} 
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Analysis;
