
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
export const getSurveyOptions = async (userId?: string): Promise<SurveyOption[]> => {
  try {
    // If no userId provided, we can't filter by user
    if (!userId) {
      console.log("No user ID provided to getSurveyOptions, returning empty array");
      return [];
    }
    
    console.log(`Fetching surveys for user ID: ${userId}`);
    
    // Try to get data from Supabase with user filter
    const { data, error } = await supabase
      .from('survey_templates')
      .select('id, name, date')
      .eq('creator_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching surveys:', error);
      throw error;
    }
    
    // Return the actual data, even if empty
    return data?.map(survey => ({
      id: survey.id,
      name: survey.name,
      date: new Date(survey.date).toLocaleDateString(),
    })) || [];
    
  } catch (error) {
    console.error('Error in getSurveyOptions:', error);
    // Return empty array instead of mock data to accurately reflect no surveys
    return [];
  }
};

// Function to get recommendation score
export const getRecommendationScore = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<{ score: number, nationalAverage: number }> => {
  try {
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
    
    // If no data, return zeros instead of mock data
    if (!data || data.length === 0) {
      return {
        score: 0,
        nationalAverage: 7.8 // Keep the benchmark
      };
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
    console.error('Error in getRecommendationScore:', error);
    // Return zeros instead of mock data
    return { score: 0, nationalAverage: 7.8 };
  }
};

// Function to get leaving contemplation data
export const getLeavingContemplation = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<Record<string, number>> => {
  try {
    // Define the expected response categories
    const emptyCounts: Record<string, number> = {
      "Strongly Agree": 0,
      "Agree": 0,
      "Disagree": 0, 
      "Strongly Disagree": 0
    };
    
    // Try to get real data from Supabase
    const query = supabase
      .from('survey_responses')
      .select('leaving_contemplation')
      .eq('survey_template_id', surveyId)
      .not('leaving_contemplation', 'is', null); // Only select non-null responses
    
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
    
    // If no data, return empty structure
    if (!data || data.length === 0) {
      return emptyCounts;
    }
    
    // Count responses for each option
    const counts = { ...emptyCounts };
    
    // Map the database values to our expected categories
    const valueMapping: Record<string, string> = {
      'Often': 'Strongly Agree',
      'Sometimes': 'Agree',
      'Rarely': 'Disagree',
      'Never': 'Strongly Disagree'
    };
    
    data.forEach(response => {
      const dbValue = response.leaving_contemplation;
      if (dbValue) {
        // Map the database value to the expected category
        const mappedValue = valueMapping[dbValue] || dbValue;
        if (counts[mappedValue] !== undefined) {
          counts[mappedValue]++;
        }
      }
    });
    
    console.log('Leaving contemplation data:', counts);
    
    // Convert to percentages for consistency with other charts
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const percentages: Record<string, number> = { ...emptyCounts };
    
    if (total > 0) {
      Object.keys(percentages).forEach(key => {
        percentages[key] = Math.round((counts[key] / total) * 100) / 100; // Return as decimal for stacked charts
      });
    }
    
    return percentages;
  } catch (error) {
    console.error('Error in getLeavingContemplation:', error);
    // Return empty structure instead of mock data
    return {
      "Strongly Agree": 0,
      "Agree": 0,
      "Disagree": 0, 
      "Strongly Disagree": 0
    };
  }
};

// Function to get detailed wellbeing responses
export const getDetailedWellbeingResponses = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<DetailedQuestionResponse[]> => {
  try {
    // Define the wellbeing questions
    const wellbeingQuestions = [
      "I feel valued as a member of this organisation",
      "Leadership prioritises staff wellbeing",
      "My workload is manageable",
      "I have a good work-life balance",
      "I am in good physical and mental health",
      "I can access support when I need it",
      "I feel confident in my role",
      "I am proud to work for this organisation"
    ];
    
    // Query for getting responses from Supabase
    const query = supabase
      .from('survey_responses')
      .select('valued_member, leadership_prioritize, manageable_workload, work_life_balance, health_state, support_access, confidence_in_role, org_pride')
      .eq('survey_template_id', surveyId);
    
    // Apply date filters
    if (startDate) {
      query.gte('created_at', startDate);
    }
    if (endDate) {
      query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching wellbeing responses:', error);
      throw error;
    }
    
    // If no data, return default structure with national averages
    if (!data || data.length === 0) {
      return wellbeingQuestions.map(question => ({
        question,
        schoolResponses: {
          "Strongly Agree": 0,
          "Agree": 0,
          "Disagree": 0,
          "Strongly Disagree": 0
        },
        nationalResponses: {
          "Strongly Agree": 0.25,
          "Agree": 0.40,
          "Disagree": 0.25,
          "Strongly Disagree": 0.10
        }
      }));
    }
    
    // Calculate responses for each question
    const fieldMappings = [
      'valued_member',
      'leadership_prioritize',
      'manageable_workload',
      'work_life_balance', 
      'health_state',
      'support_access',
      'confidence_in_role',
      'org_pride'
    ];
    
    return wellbeingQuestions.map((question, index) => {
      const field = fieldMappings[index];
      
      // Count responses for this question
      const responses: Record<string, number> = {
        "Strongly Agree": 0,
        "Agree": 0,
        "Disagree": 0,
        "Strongly Disagree": 0
      };
      
      data.forEach(row => {
        const answer = row[field as keyof typeof row];
        if (answer && typeof answer === 'string' && responses[answer] !== undefined) {
          responses[answer]++;
        }
      });
      
      // Convert to percentages for display in normalized charts
      const total = Object.values(responses).reduce((sum, count) => sum + count, 0);
      const percentages: Record<string, number> = { ...responses };
      
      if (total > 0) {
        Object.keys(percentages).forEach(key => {
          percentages[key] = Math.round((responses[key] / total) * 100) / 100; // Return as decimal for stacked charts
        });
      }
      
      return {
        question,
        schoolResponses: percentages,
        nationalResponses: {
          "Strongly Agree": 0.25, // Use decimals for stacked 100% charts
          "Agree": 0.40,
          "Disagree": 0.25,
          "Strongly Disagree": 0.10
        }
      };
    });
    
  } catch (error) {
    console.error('Error in getDetailedWellbeingResponses:', error);
    return [];
  }
};

// Function to get text responses
export const getTextResponses = async (
  surveyId: string,
  startDate?: string,
  endDate?: string
): Promise<{ doingWell: TextResponse[], improvements: TextResponse[] }> => {
  try {
    // Query for getting text responses from Supabase
    const query = supabase
      .from('survey_responses')
      .select('doing_well, improvements, created_at')
      .eq('survey_template_id', surveyId);
    
    // Apply date filters
    if (startDate) {
      query.gte('created_at', startDate);
    }
    if (endDate) {
      query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching text responses:', error);
      throw error;
    }
    
    // If no data, return empty arrays
    if (!data || data.length === 0) {
      return {
        doingWell: [],
        improvements: []
      };
    }
    
    // Format the responses
    const doingWell: TextResponse[] = [];
    const improvements: TextResponse[] = [];
    
    data.forEach(row => {
      const createdAt = new Date(row.created_at).toLocaleDateString();
      
      if (row.doing_well) {
        doingWell.push({
          response: row.doing_well,
          created_at: createdAt
        });
      }
      
      if (row.improvements) {
        improvements.push({
          response: row.improvements,
          created_at: createdAt
        });
      }
    });
    
    return {
      doingWell,
      improvements
    };
    
  } catch (error) {
    console.error('Error in getTextResponses:', error);
    return {
      doingWell: [],
      improvements: []
    };
  }
};
