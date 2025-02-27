
import { supabase } from './supabase';
import { toast } from 'sonner';

// Survey types
export interface Survey {
  id: number;
  name: string;
  date: string;
  close_date: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  response_count: number;
  url: string;
  user_id: string;
  created_at: string;
}

export interface SurveyInput {
  name: string;
  date: string;
  close_date: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
  url?: string;
  user_id: string;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  responses: Record<string, any>;
  created_at: string;
}

// Survey functions
export async function getSurveys(userId: string) {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching surveys:', error);
    toast.error('Failed to load surveys');
    return [];
  }
}

export async function getSurveyById(id: number, userId: string) {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching survey ${id}:`, error);
    toast.error('Failed to load survey details');
    return null;
  }
}

export async function createSurvey(survey: SurveyInput) {
  try {
    // Generate a unique URL for the survey
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const surveyUrl = `${window.location.origin}/s/${uniqueId}`;
    
    const { data, error } = await supabase
      .from('surveys')
      .insert([{ ...survey, url: surveyUrl }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating survey:', error);
    return { data: null, error };
  }
}

export async function updateSurvey(id: number, updates: Partial<SurveyInput>, userId: string) {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Error updating survey ${id}:`, error);
    return { data: null, error };
  }
}

export async function deleteSurvey(id: number, userId: string) {
  try {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting survey ${id}:`, error);
    return { success: false, error };
  }
}

// Survey responses functions
export async function submitSurveyResponse(surveyId: number, responses: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([{
        survey_id: surveyId,
        responses
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update response count in surveys table
    await updateResponseCount(surveyId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return { success: false, error };
  }
}

async function updateResponseCount(surveyId: number) {
  try {
    // Get current count
    const { data: countData, error: countError } = await supabase
      .from('survey_responses')
      .select('id', { count: 'exact' })
      .eq('survey_id', surveyId);

    if (countError) {
      throw countError;
    }

    const count = countData?.length || 0;

    // Update survey with new count
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ response_count: count })
      .eq('id', surveyId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error updating response count:', error);
  }
}

export async function getSurveyResponses(surveyId: number, userId: string) {
  try {
    // First verify that the survey belongs to the user
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', surveyId)
      .eq('user_id', userId)
      .single();

    if (surveyError || !surveyData) {
      throw new Error('Unauthorized access to survey data');
    }

    // Then get the responses
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching responses for survey ${surveyId}:`, error);
    toast.error('Failed to load survey responses');
    return [];
  }
}

// Analysis functions
export async function getAnalyticsData(surveyId: number, userId: string) {
  try {
    // First verify that the survey belongs to the user
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('user_id', userId)
      .single();

    if (surveyError || !surveyData) {
      throw new Error('Unauthorized access to survey data');
    }

    // Get the responses
    const { data: responsesData, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId);

    if (responsesError) {
      throw responsesError;
    }

    // For now, we'll return the raw data. In a real application, we would
    // process this data to calculate averages, trends, etc.
    return {
      survey: surveyData,
      responses: responsesData || []
    };
  } catch (error) {
    console.error(`Error fetching analytics for survey ${surveyId}:`, error);
    toast.error('Failed to load survey analytics');
    return { survey: null, responses: [] };
  }
}
