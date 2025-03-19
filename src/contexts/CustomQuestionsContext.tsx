
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { CustomQuestionType } from '../types/surveyForm';
import { supabase } from '../integrations/supabase/client';

interface CustomQuestionsContextType {
  questions: CustomQuestionType[];
  isLoading: boolean;
  error: string | null;
  loadQuestions: (surveyId: string) => Promise<void>;
  saveResponse: (questionId: string, value: string, responseId?: string) => Promise<boolean>;
}

const CustomQuestionsContext = createContext<CustomQuestionsContextType | undefined>(undefined);

export function CustomQuestionsProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<CustomQuestionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async (surveyId: string) => {
    if (!surveyId) {
      setQuestions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading custom questions for survey:', surveyId);
      
      // Direct query approach - first get question IDs linked to this survey
      const { data: linkData, error: linkError } = await supabase
        .from('survey_questions')
        .select('question_id')
        .eq('survey_id', surveyId);
      
      if (linkError) {
        throw new Error(`Failed to fetch question links: ${linkError.message}`);
      }
      
      if (!linkData || linkData.length === 0) {
        console.log('No custom questions linked to this survey');
        setQuestions([]);
        return;
      }
      
      console.log(`Found ${linkData.length} linked questions for survey ${surveyId}`);
      const questionIds = linkData.map(link => link.question_id);
      
      // Then get the actual questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('custom_questions')
        .select('*')
        .in('id', questionIds);
      
      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }
      
      if (!questionsData || questionsData.length === 0) {
        console.log('No custom questions found for the linked IDs');
        setQuestions([]);
        return;
      }
      
      // Format questions with proper typing
      const formattedQuestions: CustomQuestionType[] = questionsData.map(q => {
        let parsedOptions: string[] = [];
        
        // Handle options field which could be an array, string JSON, or null
        if (q.options) {
          if (Array.isArray(q.options)) {
            parsedOptions = q.options;
          } else if (typeof q.options === 'string') {
            try {
              const parsed = JSON.parse(q.options);
              if (Array.isArray(parsed)) {
                parsedOptions = parsed;
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
          options: parsedOptions
        };
      });
      
      console.log('Formatted questions:', formattedQuestions);
      setQuestions(formattedQuestions);
    } catch (err: any) {
      console.error('Error loading custom questions:', err);
      setError(err.message || 'Failed to load custom questions');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResponse = async (questionId: string, value: string, responseId?: string) => {
    if (!questionId || !responseId) return false;
    
    try {
      console.log('Saving response for question:', questionId, 'value:', value);
      
      const { error } = await supabase
        .from('custom_question_responses')
        .insert({
          question_id: questionId,
          response_id: responseId,
          answer: value
        });
      
      if (error) {
        console.error('Error saving response:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error saving response:', err);
      return false;
    }
  };

  return (
    <CustomQuestionsContext.Provider 
      value={{ questions, isLoading, error, loadQuestions, saveResponse }}
    >
      {children}
    </CustomQuestionsContext.Provider>
  );
}

export function useCustomQuestions() {
  const context = useContext(CustomQuestionsContext);
  if (context === undefined) {
    throw new Error('useCustomQuestions must be used within a CustomQuestionsProvider');
  }
  return context;
}
