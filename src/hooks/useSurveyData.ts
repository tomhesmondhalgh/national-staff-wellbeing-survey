
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
        
        // Fetch directly from the database with a join query to get both the links and questions in one go
        console.log('Fetching custom questions for survey ID:', surveyId);
        const { data: linkedQuestions, error: joinError } = await supabase
          .from('survey_questions')
          .select(`
            question_id,
            custom_questions!inner(id, text, type, options, creator_id)
          `)
          .eq('survey_id', surveyId);
          
        if (joinError) {
          console.error('Error fetching linked questions:', joinError);
          toast.error('Failed to load custom questions');
        } else {
          console.log('Linked questions data:', linkedQuestions);
          
          if (linkedQuestions && linkedQuestions.length > 0) {
            // Transform the joined data into the format we need
            const customQuestionsList: CustomQuestionType[] = linkedQuestions.map(item => ({
              id: item.custom_questions.id,
              text: item.custom_questions.text,
              type: item.custom_questions.type || 'text',
              options: Array.isArray(item.custom_questions.options) ? item.custom_questions.options : []
            }));
            
            console.log('Processed custom questions:', customQuestionsList);
            setCustomQuestions(customQuestionsList);
          } else {
            console.log('No custom questions found for this survey');
          }
        }
        
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
