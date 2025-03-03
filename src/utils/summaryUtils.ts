
import { supabase } from '../lib/supabase';
import type { 
  SurveyOption,
  DetailedQuestionResponse,
  TextResponse
} from './analysisUtils';

// Types for the summary response
export interface SummaryData {
  introduction: string;
  strengths: string[];
  improvements: string[];
  insufficientData?: boolean;
}

// Function to get AI-generated summary of survey data
export const getSurveySummary = async (
  surveyId: string,
  recommendationScore: { score: number, nationalAverage: number },
  leavingContemplation: Record<string, number>,
  detailedResponses: DetailedQuestionResponse[],
  textResponses: { doingWell: TextResponse[], improvements: TextResponse[] }
): Promise<SummaryData> => {
  try {
    // Calculate total responses to check if we have enough data
    const totalResponses = Object.values(leavingContemplation).reduce((sum, value) => sum + value, 0);
    
    // If we don't have enough data, return a message
    if (totalResponses < 20) {
      return {
        introduction: '',
        strengths: [],
        improvements: [],
        insufficientData: true
      };
    }
    
    // Call the Supabase Edge Function to generate the summary
    const { data, error } = await supabase.functions.invoke('generate-survey-summary', {
      body: {
        recommendationScore,
        leavingContemplation,
        detailedResponses,
        textResponses
      }
    });
    
    if (error) {
      console.error('Error generating survey summary:', error);
      throw error;
    }
    
    // If API returns insufficient data flag
    if (data.insufficientData) {
      return {
        introduction: '',
        strengths: [],
        improvements: [],
        insufficientData: true
      };
    }
    
    // Return the summary data
    return {
      introduction: data.introduction || '',
      strengths: data.strengths || [],
      improvements: data.improvements || []
    };
  } catch (error) {
    console.error('Error in getSurveySummary:', error);
    // Return a default error state
    return {
      introduction: 'Unable to generate summary at this time.',
      strengths: [],
      improvements: [],
    };
  }
};
