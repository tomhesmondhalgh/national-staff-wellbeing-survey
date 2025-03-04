
import { supabase, getMockSurveyOptions, getMockRecommendationScore, getMockLeavingContemplation, getMockDetailedResponses, getMockTextResponses } from '../lib/supabase';

// Type definitions
export interface SurveyOption {
  id: string;
  name: string;
  date: string;
}

export interface DetailedQuestionResponse {
  question: string;
  schoolResponses: Record<string, number>;
  nationalResponses: Record<string, number>;
}

export interface TextResponse {
  response: string;
  created_at: string;
}

// Function to get survey options
export const getSurveyOptions = async (): Promise<SurveyOption[]> => {
  try {
    // Try to get data from Supabase first
    const { data, error } = await supabase
      .from('survey_templates')
      .select('id, name, date')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }
    
    // If we got empty data from Supabase, use mock data
    if (!data || data.length === 0) {
      console.info('No surveys found in database, using mock data');
      return getMockSurveyOptions();
    }
    
    return data.map(survey => ({
      id: survey.id,
      name: survey.name,
      date: new Date(survey.date).toLocaleDateString(),
    }));
  } catch (error) {
    console.error('Error in getSurveyOptions, falling back to mock data:', error);
    return getMockSurveyOptions();
  }
};

// Function to get recommendation score
export const getRecommendationScore = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<{ score: number, nationalAverage: number }> => {
  try {
    // Start with mock data in case real data fetch fails
    const mockData = getMockRecommendationScore(surveyId);
    
    // Try to get real data from Supabase
    const query = supabase
      .from('survey_responses')
      .select('recommendation_score')
      .eq('survey_template_id', surveyId);
    
    // Apply date filters if provided
    if (startDate) {
      query.gte('created_at', startDate);
    }
    if (endDate) {
      query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching recommendation score:', error);
      throw error;
    }
    
    // If no data, return mock data
    if (!data || data.length === 0) {
      return mockData;
    }
    
    // Calculate average score from responses
    const scores = data
      .map(response => Number(response.recommendation_score))
      .filter(score => !isNaN(score));
    
    const averageScore = scores.length > 0
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
      : 0;
    
    return {
      score: averageScore,
      nationalAverage: 7.8 // Hardcoded benchmark
    };
  } catch (error) {
    console.error('Error in getRecommendationScore, using mock data:', error);
    return getMockRecommendationScore(surveyId);
  }
};

// Function to get leaving contemplation data
export const getLeavingContemplation = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<Record<string, number>> => {
  try {
    // Start with mock data in case real data fetch fails
    const mockData = getMockLeavingContemplation(surveyId);
    
    // Try to get real data from Supabase
    const query = supabase
      .from('survey_responses')
      .select('leaving_contemplation')
      .eq('survey_template_id', surveyId);
    
    // Apply date filters if provided
    if (startDate) {
      query.gte('created_at', startDate);
    }
    if (endDate) {
      query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching leaving contemplation data:', error);
      throw error;
    }
    
    // If no data, return mock data
    if (!data || data.length === 0) {
      return mockData;
    }
    
    // Count responses for each option
    const counts: Record<string, number> = {
      "Strongly Agree": 0,
      "Agree": 0,
      "Disagree": 0, 
      "Strongly Disagree": 0
    };
    
    data.forEach(response => {
      const option = response.leaving_contemplation;
      if (option && counts[option] !== undefined) {
        counts[option]++;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getLeavingContemplation, using mock data:', error);
    return getMockLeavingContemplation(surveyId);
  }
};

// Function to get detailed wellbeing responses
export const getDetailedWellbeingResponses = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<DetailedQuestionResponse[]> => {
  try {
    // Start with mock data
    const mockData = getMockDetailedResponses(surveyId);
    
    // For a real implementation, we would fetch data from Supabase here
    // with complex queries to aggregate results for each question
    
    // For demo purposes, let's return mock data directly
    return mockData;
  } catch (error) {
    console.error('Error in getDetailedWellbeingResponses, using mock data:', error);
    return getMockDetailedResponses(surveyId);
  }
};

// Function to get text responses
export const getTextResponses = async (
  surveyId: string,
  startDate?: string,
  endDate?: string
): Promise<{ doingWell: TextResponse[], improvements: TextResponse[] }> => {
  try {
    // Start with mock data
    const mockData = getMockTextResponses(surveyId);
    
    // For real implementation, we would query Supabase here
    // Select doing_well and improvements columns with timestamps
    
    // For demo purposes, let's return mock data directly
    return mockData;
  } catch (error) {
    console.error('Error in getTextResponses, using mock data:', error);
    return getMockTextResponses(surveyId);
  }
};
