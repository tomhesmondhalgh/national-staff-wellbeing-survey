
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
        console.log('Starting to fetch survey data for ID:', surveyId);
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
        
        // Direct join query to get questions in one go
        const { data: questionsData, error: questionsError } = await supabase
          .from('survey_questions')
          .select(`
            question_id,
            custom_questions(id, text, type, options)
          `)
          .eq('survey_id', surveyId);
        
        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          toast.error('Failed to load survey questions');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        console.log('Raw joined questions data:', questionsData);
        
        if (!questionsData || questionsData.length === 0) {
          console.log('No custom questions linked to this survey');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Transform joined data to our expected format
        const formattedQuestions: CustomQuestionType[] = questionsData
          .filter(item => item.custom_questions) // Filter out any null results
          .map(item => {
            const q = item.custom_questions;
            
            // Handle options - ensure they're in the right format
            let options: string[] = [];
            if (q.options) {
              if (Array.isArray(q.options)) {
                options = q.options;
              } else if (typeof q.options === 'string') {
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
            
            console.log(`Formatting question ${q.id}: ${q.text} (type: ${q.type})`, { options });
            
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
