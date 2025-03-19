
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { getSurveyById } from '../utils/survey/templates';
import { isSurveyClosed } from '../utils/survey/status';
import { SurveyTemplate } from '../utils/types/survey';
import { CustomQuestionType } from '../types/surveyForm';
import { toast } from 'sonner';

export function useSurveyData(surveyId: string | null, isPreview: boolean) {
  const [isLoading, setIsLoading] = useState(true);
  const [surveyName, setSurveyName] = useState('Wellbeing Survey');
  const [surveyData, setSurveyData] = useState<SurveyTemplate | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestionType[]>([]);

  useEffect(() => {
    if (!surveyId) {
      setIsLoading(false);
      return;
    }
    
    const fetchSurveyData = async () => {
      try {
        const surveyTemplate = await getSurveyById(surveyId);
        
        if (!surveyTemplate) {
          console.error('Survey not found');
          setIsLoading(false);
          return;
        }
        
        if (isSurveyClosed(surveyTemplate) && !isPreview) {
          setIsLoading(false);
          return { isClosed: true };
        }
        
        setSurveyName(surveyTemplate.name);
        setSurveyData(surveyTemplate);
        
        console.log('Fetching custom questions for survey ID:', surveyId);
        
        // First attempt to get the question IDs directly
        const { data: questionLinks, error: linksError } = await supabase
          .from('survey_questions')
          .select('question_id')
          .eq('survey_id', surveyId);
        
        if (linksError) {
          console.error('Error fetching question links:', linksError);
          toast.error('Failed to load questions');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        console.log('Found question links:', questionLinks);
        
        if (!questionLinks || questionLinks.length === 0) {
          console.log('No custom questions linked to this survey');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Extract question IDs
        const questionIds = questionLinks.map(link => link.question_id);
        console.log('Question IDs to fetch:', questionIds);
        
        // Fetch the actual questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('custom_questions')
          .select('*')
          .in('id', questionIds);
        
        if (questionsError) {
          console.error('Error fetching custom questions:', questionsError);
          toast.error('Failed to load question content');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        console.log('Raw questions data from database:', questionsData);
        
        if (!questionsData || questionsData.length === 0) {
          console.log('No questions found despite having links');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Transform to our expected format
        const formattedQuestions: CustomQuestionType[] = questionsData.map(q => {
          // Ensure we have proper options handling
          let options: string[] = [];
          if (q.options) {
            if (Array.isArray(q.options)) {
              options = q.options;
            } else if (typeof q.options === 'string') {
              // Handle case where options might be a JSON string
              try {
                const parsed = JSON.parse(q.options);
                if (Array.isArray(parsed)) {
                  options = parsed;
                }
              } catch (e) {
                console.error('Failed to parse options:', e);
              }
            }
          }
          
          return {
            id: q.id,
            text: q.text,
            type: q.type || 'text',
            options: options
          };
        });
        
        console.log('Formatted custom questions:', formattedQuestions);
        setCustomQuestions(formattedQuestions);
        
        return { isClosed: false };
      } catch (error) {
        console.error('Error fetching survey data:', error);
        toast.error('Failed to load survey');
        return { isClosed: false };
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurveyData().then(result => {
      if (result?.isClosed) {
        // We'll handle navigation in the parent component
      }
    });
  }, [surveyId, isPreview]);

  return {
    isLoading,
    surveyName,
    surveyData,
    customQuestions
  };
}
