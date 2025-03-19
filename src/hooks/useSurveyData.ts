
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
        
        // First, check if there are any survey_questions records for this survey
        const { data: linkData, error: linkError } = await supabase
          .from('survey_questions')
          .select('question_id, id')
          .eq('survey_id', surveyId);
        
        if (linkError) {
          console.error('Error fetching survey_questions links:', linkError);
          toast.error('Failed to load survey question links');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        console.log('Survey question links found:', linkData);
        
        if (!linkData || linkData.length === 0) {
          console.log('No custom questions linked to this survey');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Extract question IDs from the links
        const questionIds = linkData.map(link => link.question_id);
        console.log('Question IDs to fetch:', questionIds);
        
        // Then fetch the actual custom questions using those IDs
        const { data: questionsData, error: questionsError } = await supabase
          .from('custom_questions')
          .select('id, text, type, options')
          .in('id', questionIds);
        
        if (questionsError) {
          console.error('Error fetching custom questions:', questionsError);
          toast.error('Failed to load custom questions');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        console.log('Raw custom questions data:', questionsData);
        
        if (!questionsData || questionsData.length === 0) {
          console.log('No custom questions found with the linked IDs');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Transform and format the questions data
        const formattedQuestions: CustomQuestionType[] = questionsData.map(q => {
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
