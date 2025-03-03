
import { supabase } from '../lib/supabase';

export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'dropdown';
  options: string[] | null;
  creator_id: string;
  created_at: string;
}

export interface CustomQuestionResponse {
  id: string;
  question_id: string;
  response_id: string;
  answer: string;
  created_at: string;
}

export const getCustomQuestions = async (userId: string): Promise<CustomQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching custom questions:', error);
    return [];
  }
};

export const getSurveyCustomQuestions = async (surveyId: string): Promise<CustomQuestion[]> => {
  try {
    const { data: surveyQuestionsData, error: surveyQuestionsError } = await supabase
      .from('survey_questions')
      .select('question_id')
      .eq('survey_id', surveyId);
      
    if (surveyQuestionsError) {
      throw surveyQuestionsError;
    }
    
    if (!surveyQuestionsData || surveyQuestionsData.length === 0) {
      return [];
    }
    
    const questionIds = surveyQuestionsData.map(sq => sq.question_id);
    
    const { data, error } = await supabase
      .from('custom_questions')
      .select('*')
      .in('id', questionIds);
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching survey custom questions:', error);
    return [];
  }
};

export const getCustomQuestionResponses = async (questionId: string, surveyId: string): Promise<CustomQuestionResponse[]> => {
  try {
    // First get response IDs for this survey
    const { data: responsesData, error: responsesError } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_template_id', surveyId);
      
    if (responsesError) {
      throw responsesError;
    }
    
    if (!responsesData || responsesData.length === 0) {
      return [];
    }
    
    const responseIds = responsesData.map(r => r.id);
    
    // Then get custom question responses
    const { data, error } = await supabase
      .from('custom_question_responses')
      .select('*')
      .eq('question_id', questionId)
      .in('response_id', responseIds);
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching custom question responses:', error);
    return [];
  }
};
