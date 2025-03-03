
import { supabase } from "../lib/supabase";
import { CustomQuestion, SurveyQuestion } from "../types/customQuestions";

// Fetch custom questions created by the current user
export const getUserCustomQuestions = async (): Promise<CustomQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching custom questions:', error);
      return [];
    }
    
    return data as CustomQuestion[];
  } catch (error) {
    console.error('Unexpected error in getUserCustomQuestions:', error);
    return [];
  }
};

// Create a new custom question
export const createCustomQuestion = async (
  text: string,
  type: 'text' | 'dropdown',
  options: string[] | null = null
): Promise<CustomQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('custom_questions')
      .insert({
        text,
        type,
        options
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating custom question:', error);
      return null;
    }
    
    return data as CustomQuestion;
  } catch (error) {
    console.error('Unexpected error in createCustomQuestion:', error);
    return null;
  }
};

// Update an existing custom question
export const updateCustomQuestion = async (
  id: string,
  text: string,
  type: 'text' | 'dropdown',
  options: string[] | null = null
): Promise<CustomQuestion | null> => {
  try {
    const { data, error } = await supabase
      .from('custom_questions')
      .update({
        text,
        type,
        options
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating custom question:', error);
      return null;
    }
    
    return data as CustomQuestion;
  } catch (error) {
    console.error('Unexpected error in updateCustomQuestion:', error);
    return null;
  }
};

// Delete a custom question
export const deleteCustomQuestion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('custom_questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting custom question:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in deleteCustomQuestion:', error);
    return false;
  }
};

// Get questions for a specific survey
export const getSurveyCustomQuestions = async (surveyId: string): Promise<CustomQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_questions')
      .select(`
        question_id,
        custom_questions (*)
      `)
      .eq('survey_id', surveyId);
    
    if (error) {
      console.error('Error fetching survey custom questions:', error);
      return [];
    }
    
    // Transform the joined data to a flat array of custom questions
    return data.map(item => item.custom_questions) as CustomQuestion[];
  } catch (error) {
    console.error('Unexpected error in getSurveyCustomQuestions:', error);
    return [];
  }
};

// Add custom questions to a survey
export const addQuestionsToSurvey = async (surveyId: string, questionIds: string[]): Promise<boolean> => {
  try {
    // Prepare the array of objects to insert
    const questionsToAdd = questionIds.map(questionId => ({
      survey_id: surveyId,
      question_id: questionId
    }));
    
    const { error } = await supabase
      .from('survey_questions')
      .insert(questionsToAdd);
    
    if (error) {
      console.error('Error adding questions to survey:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in addQuestionsToSurvey:', error);
    return false;
  }
};

// Get custom question responses for a particular survey
export const getCustomQuestionResponses = async (surveyId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        custom_question_responses (
          id,
          question_id,
          answer,
          custom_questions (
            id,
            text,
            type,
            options
          )
        )
      `)
      .eq('survey_template_id', surveyId);
    
    if (error) {
      console.error('Error fetching custom question responses:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getCustomQuestionResponses:', error);
    return [];
  }
};

// Submit custom question responses
export const submitCustomQuestionResponses = async (
  responseId: string, 
  responses: { questionId: string, answer: string }[]
): Promise<boolean> => {
  try {
    // Prepare the array of responses to insert
    const responsesToAdd = responses.map(response => ({
      response_id: responseId,
      question_id: response.questionId,
      answer: response.answer
    }));
    
    const { error } = await supabase
      .from('custom_question_responses')
      .insert(responsesToAdd);
    
    if (error) {
      console.error('Error submitting custom question responses:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in submitCustomQuestionResponses:', error);
    return false;
  }
};
