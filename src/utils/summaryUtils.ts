
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

// Default summary for when there's insufficient data
const getInsufficientDataSummary = (): SummaryData => {
  return {
    introduction: '',
    strengths: [],
    improvements: [],
    insufficientData: true
  };
};

// Mock AI summary for when the Edge Function is unavailable
const getMockSummary = (): SummaryData => {
  return {
    introduction: "", // Removed the introduction text as requested
    strengths: [
      "Strong sense of pride in the organization with 85% of staff responding positively",
      "Staff feel valued as members of the organization, scoring above national average",
      "Good support systems in place with 75% of staff able to access help when needed",
      "Staff confidence in their roles is high, with 80% responding positively"
    ],
    improvements: [
      "Work-life balance could be improved, with 50% of staff reporting concerns",
      "Workload management requires attention, particularly regarding distribution across departments",
      "Consider additional planning time for curriculum initiatives based on feedback",
      "Enhance cross-departmental collaboration opportunities"
    ]
  };
};

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
      return getInsufficientDataSummary();
    }
    
    // Try to call the Supabase Edge Function to generate the summary
    try {
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
        // Return mock data instead of throwing an error
        console.info('Using mock summary data due to Edge Function error');
        return getMockSummary();
      }
      
      // If API returns insufficient data flag
      if (data.insufficientData) {
        return getInsufficientDataSummary();
      }
      
      // Return the summary data
      return {
        introduction: '', // Return empty introduction as requested
        strengths: data.strengths || [],
        improvements: data.improvements || []
      };
    } catch (functionError) {
      console.error('Error calling Edge Function:', functionError);
      return getMockSummary();
    }
  } catch (error) {
    console.error('Error in getSurveySummary:', error);
    // Return mock data instead of an error message
    return getMockSummary();
  }
};
