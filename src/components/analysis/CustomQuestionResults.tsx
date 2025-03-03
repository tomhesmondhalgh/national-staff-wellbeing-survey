
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface CustomQuestionResultsProps {
  surveyId: string;
  startDate?: string;
  endDate?: string;
}

interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'dropdown';
  options: string[] | null;
}

interface CustomResponse {
  answer: string;
}

const CustomQuestionResults: React.FC<CustomQuestionResultsProps> = ({ 
  surveyId, 
  startDate, 
  endDate 
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, CustomResponse[]>>({});
  const [chartData, setChartData] = useState<Record<string, any[]>>({});
  
  const barColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
    '#d0ed57', '#83a6ed', '#8dd1e1', '#a4262c', '#ca8142'
  ];

  useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        setLoading(true);
        
        // Get the questions attached to this survey
        const { data: surveyQuestionsData, error: surveyQuestionsError } = await supabase
          .from('survey_questions')
          .select('question_id')
          .eq('survey_id', surveyId);
          
        if (surveyQuestionsError) throw surveyQuestionsError;
        
        if (!surveyQuestionsData || surveyQuestionsData.length === 0) {
          setLoading(false);
          return;
        }
        
        const questionIds = surveyQuestionsData.map(sq => sq.question_id);
        
        // Get the question details
        const { data: questionsData, error: questionsError } = await supabase
          .from('custom_questions')
          .select('*')
          .in('id', questionIds);
          
        if (questionsError) throw questionsError;
        
        setQuestions(questionsData || []);
        
        // Get survey responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('survey_template_id', surveyId)
          .order('created_at', { ascending: false });
          
        if (responsesError) throw responsesError;
        
        if (!responsesData || responsesData.length === 0) {
          setLoading(false);
          return;
        }
        
        const responseIds = responsesData.map(response => response.id);
        
        // Get custom question responses
        const { data: customResponsesData, error: customResponsesError } = await supabase
          .from('custom_question_responses')
          .select('*')
          .in('response_id', responseIds);
          
        if (customResponsesError) throw customResponsesError;
        
        // Group responses by question
        const groupedResponses: Record<string, CustomResponse[]> = {};
        
        if (customResponsesData) {
          customResponsesData.forEach(response => {
            if (!groupedResponses[response.question_id]) {
              groupedResponses[response.question_id] = [];
            }
            
            groupedResponses[response.question_id].push({
              answer: response.answer
            });
          });
        }
        
        setResponses(groupedResponses);
        
        // Prepare chart data for dropdown questions
        const chartDataByQuestion: Record<string, any[]> = {};
        
        questionsData?.forEach(question => {
          if (question.type === 'dropdown' && groupedResponses[question.id]) {
            const answers = groupedResponses[question.id].map(r => r.answer);
            
            // Count occurrences of each option
            const counts: Record<string, number> = {};
            answers.forEach(answer => {
              counts[answer] = (counts[answer] || 0) + 1;
            });
            
            // Format for chart
            chartDataByQuestion[question.id] = Object.entries(counts).map(([option, count]) => ({
              name: option,
              count
            }));
          }
        });
        
        setChartData(chartDataByQuestion);
      } catch (error) {
        console.error('Error fetching custom question results:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (surveyId) {
      fetchCustomQuestions();
    }
  }, [surveyId, startDate, endDate]);
  
  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (questions.length === 0) {
    return null; // Don't show the section if no custom questions
  }
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Custom Question Results</CardTitle>
        <CardDescription>
          Responses to custom questions added to this survey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {questions.map((question) => (
            <div key={question.id} className="border-t pt-6">
              <h3 className="text-lg font-medium mb-3">{question.text}</h3>
              
              {question.type === 'dropdown' && chartData[question.id] && chartData[question.id].length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData[question.id]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        angle={-35}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {chartData[question.id].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses[question.id] && responses[question.id].length > 0 ? (
                    responses[question.id].map((response, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-700">{response.answer}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No responses yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomQuestionResults;
