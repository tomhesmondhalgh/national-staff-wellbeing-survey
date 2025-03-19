
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { CustomQuestionType } from '../types/surveyForm';
import { toast } from 'sonner';

export function useSurveyCustomQuestions(surveyId: string | null) {
  const [questions, setQuestions] = useState<CustomQuestionType[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchCustomQuestions = async () => {
      if (!surveyId) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading custom questions for survey:', surveyId);
        
        // Direct query with join for better performance and reliability
        const { data: joinedData, error: joinError } = await supabase
          .from('survey_questions')
          .select(`
            id,
            question_id,
            survey_id,
            custom_questions:question_id (
              id, 
              text,
              type,
              options
            )
          `)
          .eq('survey_id', surveyId);
        
        if (joinError) {
          console.error('Error fetching linked questions with join:', joinError);
          throw new Error(`Failed to fetch questions: ${joinError.message}`);
        }
        
        console.log('Survey questions join result:', joinedData);
        
        if (!joinedData || joinedData.length === 0) {
          console.log('No custom questions found for survey ID:', surveyId);
          setQuestions([]);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }
        
        // Extract and format the questions from the join results
        const processedQuestions = joinedData
          .filter(item => item.custom_questions) // Filter out any null results
          .map(item => {
            const q = item.custom_questions;
            
            // Ensure options are properly formatted
            let formattedOptions: string[] = [];
            if (q.options) {
              if (Array.isArray(q.options)) {
                formattedOptions = q.options;
              } else if (typeof q.options === 'string') {
                try {
                  const parsed = JSON.parse(q.options);
                  if (Array.isArray(parsed)) {
                    formattedOptions = parsed;
                  }
                } catch (e) {
                  console.error('Failed to parse options string:', e);
                }
              }
            }
            
            return {
              id: q.id,
              text: q.text,
              type: q.type || 'text',
              options: formattedOptions
            };
          });
        
        console.log('Processed custom questions:', processedQuestions);
        setQuestions(processedQuestions);
      } catch (err: any) {
        console.error('Error loading custom questions:', err);
        setError(err.message || 'Failed to load custom questions');
        toast.error('Error loading survey questions');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    fetchCustomQuestions();
  }, [surveyId]);

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const hasQuestions = questions.length > 0;

  return {
    questions,
    responses,
    hasQuestions,
    isLoading: isLoading && !isInitialized,
    error,
    handleResponse
  };
}
