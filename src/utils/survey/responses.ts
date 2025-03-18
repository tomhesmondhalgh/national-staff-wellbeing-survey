
import { supabase } from "../../lib/supabase";

/**
 * Counts the number of responses for a given survey
 * 
 * @param surveyId - The ID of the survey to count responses for
 * @returns The count of responses or 0 if an error occurs
 */
export const countSurveyResponses = async (surveyId: string): Promise<number> => {
  try {
    console.log(`Counting responses for survey ${surveyId}`);
    
    // Use a raw count query to avoid type instantiation issues
    const { data, error } = await supabase
      .rpc('count_survey_responses', { survey_id: surveyId });
    
    if (error) {
      console.error(`Error counting responses for survey ${surveyId}:`, error);
      return 0;
    }
    
    console.log(`Responses for survey ${surveyId}:`, data);
    return data || 0;
  } catch (error) {
    console.error(`Unexpected error counting responses for survey ${surveyId}:`, error);
    return 0;
  }
};

/**
 * Counts the number of email responses for a given survey
 * 
 * @param surveyId - The ID of the survey to count email responses for
 * @returns The count of email responses or 0 if an error occurs
 */
export const countEmailResponses = async (surveyId: string): Promise<number> => {
  try {
    console.log(`Counting email responses for survey ${surveyId}`);
    
    // Use a raw count query to avoid type instantiation issues
    const { data, error } = await supabase
      .rpc('count_email_responses', { survey_id: surveyId });
    
    if (error) {
      console.error(`Error counting email responses for survey ${surveyId}:`, error);
      return 0;
    }
    
    console.log(`Email responses for survey ${surveyId}:`, data);
    return data || 0;
  } catch (error) {
    console.error(`Unexpected error counting email responses for survey ${surveyId}:`, error);
    return 0;
  }
};
