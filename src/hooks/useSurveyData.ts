
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
        
        // ==== ENHANCED DEBUGGING FOR TARGET SURVEY ====
        const isTargetSurvey = surveyId === 'c316b756-5b93-451f-b14e-2cc1df916def';
        if (isTargetSurvey) {
          console.log('DEBUGGING TARGET SURVEY DATA FETCHING');
        }
        
        console.log('Fetching custom questions for survey ID:', surveyId);
        
        // Query both tables directly with a join to ensure we get all data in one request
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
          if (isTargetSurvey) {
            console.error('Join query error details:', joinError.message, joinError.details);
          }
          
          // Try the two-step process as fallback
          console.log('Falling back to two-step query process');
          return await fetchQuestionsInTwoSteps(surveyId, isTargetSurvey);
        }
        
        if (isTargetSurvey) {
          console.log('JOIN QUERY RESULTS:', joinedData);
        }
        
        if (!joinedData || joinedData.length === 0) {
          console.log('No linked questions found in join query');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Extract and format the questions from the join results
        const questionsFromJoin = joinedData
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
        
        if (isTargetSurvey) {
          console.log('Formatted questions from join:', questionsFromJoin);
        }
        
        setCustomQuestions(questionsFromJoin);
        setIsLoading(false);
        return { isClosed: false };
        
      } catch (error) {
        console.error('Error fetching survey data:', error);
        toast.error('Failed to load survey');
        setIsLoading(false);
        return { isClosed: false };
      }
    };
    
    const fetchQuestionsInTwoSteps = async (surveyId: string, isTargetSurvey: boolean) => {
      try {
        // First, check if there are any survey_questions records for this survey
        const { data: linkData, error: linkError } = await supabase
          .from('survey_questions')
          .select('question_id, id')
          .eq('survey_id', surveyId);
        
        if (linkError) {
          console.error('Error fetching survey_questions links:', linkError);
          if (isTargetSurvey) {
            console.error('Link query error details:', linkError.message, linkError.details);
          }
          toast.error('Failed to load survey question links');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        if (isTargetSurvey) {
          console.log('Survey question links found:', linkData);
        }
        
        if (!linkData || linkData.length === 0) {
          console.log('No custom questions linked to this survey');
          setCustomQuestions([]);
          setIsLoading(false);
          return { isClosed: false };
        }
        
        // Extract question IDs from the links
        const questionIds = linkData.map(link => link.question_id);
        if (isTargetSurvey) {
          console.log('Question IDs to fetch:', questionIds);
        }
        
        // Then fetch the actual custom questions using those IDs
        const { data: questionsData, error: questionsError } = await supabase
          .from('custom_questions')
          .select('id, text, type, options')
          .in('id', questionIds);
        
        if (questionsError) {
          console.error('Error fetching custom questions:', questionsError);
          if (isTargetSurvey) {
            console.error('Questions query error details:', questionsError.message, questionsError.details);
          }
          toast.error('Failed to load custom questions');
          setIsLoading(false);
          return { isClosed: false };
        }
        
        if (isTargetSurvey) {
          console.log('Raw custom questions data:', questionsData);
        }
        
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
          
          if (isTargetSurvey) {
            console.log(`Formatting question ${q.id}: ${q.text} (type: ${q.type})`, { options });
          }
          
          return {
            id: q.id,
            text: q.text,
            type: q.type || 'text',
            options: options
          };
        });
        
        if (isTargetSurvey) {
          console.log('Formatted custom questions:', formattedQuestions);
        }
        
        setCustomQuestions(formattedQuestions);
        return { isClosed: false };
      } catch (error) {
        console.error('Error in two-step query process:', error);
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
