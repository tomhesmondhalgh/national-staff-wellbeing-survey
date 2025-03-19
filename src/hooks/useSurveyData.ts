
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
        
        const { data: questionLinks, error: linksError } = await supabase
          .from('survey_questions')
          .select('question_id')
          .eq('survey_id', surveyId);
          
        if (linksError) {
          console.error('Error fetching question links:', linksError);
        }
        
        if (questionLinks && questionLinks.length > 0) {
          const questionIds = questionLinks.map(link => link.question_id);
          
          const { data: questions, error: questionsError } = await supabase
            .from('custom_questions')
            .select('*')
            .in('id', questionIds);
            
          if (questionsError) {
            console.error('Error fetching custom questions:', questionsError);
          } else if (questions) {
            const customQuestionsList = questions.map(q => ({
              id: q.id,
              text: q.text,
              type: q.type || 'text',
              options: q.options || []
            }));
            
            console.log('Fetched custom questions:', customQuestionsList);
            setCustomQuestions(customQuestionsList);
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
