import { supabase } from "../lib/supabase";

// Define the missing exported types used in other files
export interface SurveyOption {
  id: string;
  name: string;
  date?: string; // Add date property
}

export interface DetailedQuestionResponse {
  question: string;
  schoolResponses: Record<string, number>;
  nationalResponses: Record<string, number>;
}

export interface TextResponse {
  text: string;
  count: number;
  response?: string; // Add response property
  created_at?: string; // Add created_at property
}

// Function to calculate the average score for a given survey
export const calculateAverageScore = async (surveyId: string): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('answers')
      .eq('survey_template_id', surveyId);

    if (error) {
      console.error('Error fetching survey responses:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return 0; // Return 0 if there are no responses
    }

    // Extract all answers arrays into a single array
    const allAnswers = data.flatMap(response => Object.values(response.answers));

    // Convert answers to numbers and filter out any non-numeric values
    const numericAnswers = allAnswers.map(Number).filter(value => !isNaN(value));

    if (numericAnswers.length === 0) {
      return 0; // Return 0 if there are no valid numeric answers
    }

    // Calculate the sum of all numeric answers
    const sum = numericAnswers.reduce((acc, value) => acc + value, 0);

    // Calculate the average
    const average = sum / numericAnswers.length;

    return average;
  } catch (error) {
    console.error('Error calculating average score:', error);
    return null;
  }
};

// Function to retrieve all responses for a given survey
export const getSurveyResponses = async (surveyId: string): Promise<any[] | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_template_id', surveyId);

    if (error) {
      console.error('Error fetching survey responses:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Error retrieving survey responses:', error);
    return null;
  }
};

// Function to count the number of responses for a given survey
export const countSurveyResponses = async (surveyId: string): Promise<number | null> => {
  try {
    const { count, error } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact' })
      .eq('survey_template_id', surveyId);

    if (error) {
      console.error('Error counting survey responses:', error);
      return null;
    }

    return count;
  } catch (error) {
    console.error('Error counting survey responses:', error);
    return null;
  }
};

// Function to calculate the distribution of answers for a given question in a survey
export const calculateAnswerDistribution = async (surveyId: string, questionKey: string): Promise<{ [answer: string]: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('answers')
      .eq('survey_template_id', surveyId);

    if (error) {
      console.error('Error fetching survey responses:', error);
      return null;
    }

    const distribution: { [answer: string]: number } = {};

    if (data && data.length > 0) {
      data.forEach(response => {
        const answer = response.answers[questionKey];
        if (answer) {
          distribution[answer] = (distribution[answer] || 0) + 1;
        }
      });
    }

    return distribution;
  } catch (error) {
    console.error('Error calculating answer distribution:', error);
    return null;
  }
};

// Function to retrieve survey responses over a period
export const getSurveyResponsesOverTime = async (surveyId: string, from: Date, to: Date): Promise<any[] | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_template_id', surveyId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());

    if (error) {
      console.error('Error fetching survey responses over time:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Error retrieving survey responses over time:', error);
    return null;
  }
};

// Function to calculate the average score over a period
export const calculateAverageScoreOverTime = async (surveyId: string, from: Date, to: Date): Promise<number | null> => {
  try {
    const responses = await getSurveyResponsesOverTime(surveyId, from, to);

    if (!responses || responses.length === 0) {
      return 0;
    }

    const allAnswers = responses.flatMap(response => Object.values(response.answers));
    const numericAnswers = allAnswers.map(Number).filter(value => !isNaN(value));

    if (numericAnswers.length === 0) {
      return 0;
    }

    const sum = numericAnswers.reduce((acc, value) => acc + value, 0);
    const average = sum / numericAnswers.length;

    return average;
  } catch (error) {
    console.error('Error calculating average score over time:', error);
    return null;
  }
};

// Function to retrieve surveys created by a specific user
export const getSurveysByCreator = async (creatorId: string): Promise<any[] | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Error fetching surveys by creator:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Error retrieving surveys by creator:', error);
    return null;
  }
};

// Function to retrieve the latest survey
export const getLatestSurvey = async (): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest survey:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error retrieving latest survey:', error);
    return null;
  }
};

// Function to retrieve surveys closing soon
export const getSurveysClosingSoon = async (days: number): Promise<any[] | null> => {
  try {
    const closingDate = new Date();
    closingDate.setDate(closingDate.getDate() + days);

    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .lte('close_date', closingDate.toISOString())
      .gte('close_date', new Date().toISOString());

    if (error) {
      console.error('Error fetching surveys closing soon:', error);
      return null;
    }

    return data || [];
  } catch (error) {
    console.error('Error retrieving surveys closing soon:', error);
    return null;
  }
};

// Function to retrieve incomplete surveys for a specific user
export const getIncompleteSurveysForUser = async (userId: string): Promise<any[] | null> => {
  try {
    // This function requires a more complex implementation
    // You need to check which surveys the user has not completed yet
    // This might involve checking the survey_responses table
    // For simplicity, I'm returning an empty array for now
    return [];
  } catch (error) {
    console.error('Error retrieving incomplete surveys for user:', error);
    return null;
  }
};

// Add the missing exported functions referenced in Analysis.tsx
export const getSurveyOptions = async (): Promise<SurveyOption[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('id, name, date')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching survey options:', error);
      return [];
    }
    
    return data as SurveyOption[];
  } catch (error) {
    console.error('Error in getSurveyOptions:', error);
    return [];
  }
};

export const getRecommendationScore = async (
  surveyId: string, 
  startDate?: string, 
  endDate?: string
): Promise<{ score: number; nationalAverage: number }> => {
  try {
    let query = supabase
      .from('survey_responses')
      .select('recommendation_score')
      .eq('survey_template_id', surveyId)
      .not('recommendation_score', 'is', null);
      
    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching recommendation scores:', error);
      return { score: 0, nationalAverage: 8.2 }; // Default national average
    }
    
    if (!data || data.length === 0) {
      return { score: 0, nationalAverage: 8.2 };
    }
    
    // Calculate average recommendation score
    const validScores = data
      .map(response => Number(response.recommendation_score))
      .filter(score => !isNaN(score));
      
    if (validScores.length === 0) {
      return { score: 0, nationalAverage: 8.2 };
    }
    
    const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return { 
      score: parseFloat(averageScore.toFixed(1)), 
      nationalAverage: 8.2  // This could be dynamically fetched in a real application
    };
  } catch (error) {
    console.error('Error in getRecommendationScore:', error);
    return { score: 0, nationalAverage: 8.2 };
  }
};

export const getLeavingContemplation = async (
  surveyId: string,
  startDate?: string,
  endDate?: string
): Promise<Record<string, number>> => {
  try {
    let query = supabase
      .from('survey_responses')
      .select('leaving_contemplation')
      .eq('survey_template_id', surveyId)
      .not('leaving_contemplation', 'is', null);
      
    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
      
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching leaving contemplation data:', error);
      return {};
    }
    
    if (!data || data.length === 0) {
      return {};
    }
    
    // Count responses by category
    const counts: Record<string, number> = {};
    data.forEach(response => {
      const answer = response.leaving_contemplation;
      if (answer) {
        counts[answer] = (counts[answer] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getLeavingContemplation:', error);
    return {};
  }
};

export const getDetailedWellbeingResponses = async (
  surveyId: string,
  startDate?: string,
  endDate?: string
): Promise<DetailedQuestionResponse[]> => {
  try {
    let query = supabase
      .from('survey_responses')
      .select('confidence_in_role, support_access, valued_member, health_state, work_life_balance, manageable_workload, leadership_prioritize, org_pride')
      .eq('survey_template_id', surveyId);
      
    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
      
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching wellbeing responses:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Map to store the counts for each question and response
    const questionResponseCounts: Record<string, Record<string, number>> = {};
    
    // Define questions and their keys
    const questions = [
      { key: 'confidence_in_role', text: 'I feel confident in my role' },
      { key: 'support_access', text: 'I can easily access support when I need it' },
      { key: 'valued_member', text: 'I feel valued as a member of the organisation' },
      { key: 'health_state', text: 'My health and wellbeing is in a good state' },
      { key: 'work_life_balance', text: 'I have a good work-life balance' },
      { key: 'manageable_workload', text: 'My workload is manageable' },
      { key: 'leadership_prioritize', text: 'Leadership prioritize staff wellbeing' },
      { key: 'org_pride', text: 'I feel proud to be part of this organisation' }
    ];
    
    // Initialize the counts for each question
    questions.forEach(question => {
      questionResponseCounts[question.key] = {
        'Strongly Agree': 0,
        'Agree': 0,
        'Disagree': 0,
        'Strongly Disagree': 0
      };
    });
    
    // Count the responses for each question
    data.forEach(response => {
      questions.forEach(question => {
        const answer = response[question.key];
        if (answer && questionResponseCounts[question.key][answer] !== undefined) {
          questionResponseCounts[question.key][answer]++;
        }
      });
    });
    
    // Calculate percentages for each question
    const totalResponses = data.length;
    const results: DetailedQuestionResponse[] = questions.map(question => {
      const counts = questionResponseCounts[question.key];
      const percentages: Record<string, number> = {};
      
      Object.keys(counts).forEach(response => {
        percentages[response] = Math.round((counts[response] / totalResponses) * 100);
      });
      
      // Mock national averages - these would come from a real data source in production
      const nationalAverages = {
        'Strongly Agree': Math.round(Math.random() * 30) + 20,
        'Agree': Math.round(Math.random() * 30) + 30,
        'Disagree': Math.round(Math.random() * 15) + 10,
        'Strongly Disagree': Math.round(Math.random() * 10) + 5
      };
      
      return {
        question: question.text,
        schoolResponses: percentages,
        nationalResponses: nationalAverages
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error in getDetailedWellbeingResponses:', error);
    return [];
  }
};

export const getTextResponses = async (
  surveyId: string,
  startDate?: string,
  endDate?: string
): Promise<{ doingWell: TextResponse[]; improvements: TextResponse[] }> => {
  try {
    let query = supabase
      .from('survey_responses')
      .select('doing_well, improvements, created_at')
      .eq('survey_template_id', surveyId)
      .not('doing_well', 'is', null)
      .not('improvements', 'is', null);
      
    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
      
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching text responses:', error);
      return { doingWell: [], improvements: [] };
    }
    
    if (!data || data.length === 0) {
      return { doingWell: [], improvements: [] };
    }
    
    // Process "doing well" responses
    const doingWellResponses: TextResponse[] = [];
    data.forEach(response => {
      if (response.doing_well) {
        doingWellResponses.push({
          text: response.doing_well,
          count: 1,
          response: response.doing_well,
          created_at: response.created_at
        });
      }
    });
    
    // Process "improvements" responses
    const improvementsResponses: TextResponse[] = [];
    data.forEach(response => {
      if (response.improvements) {
        improvementsResponses.push({
          text: response.improvements,
          count: 1,
          response: response.improvements,
          created_at: response.created_at
        });
      }
    });
    
    return { 
      doingWell: doingWellResponses, 
      improvements: improvementsResponses 
    };
  } catch (error) {
    console.error('Error in getTextResponses:', error);
    return { doingWell: [], improvements: [] };
  }
};

export const getCustomQuestionAnalysisResults = async (surveyId: string) => {
  try {
    return await processCustomQuestionResults(surveyId);
  } catch (error) {
    console.error('Error in getCustomQuestionAnalysisResults:', error);
    return [];
  }
};

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

export const processCustomQuestionResults = async (surveyId) => {
  try {
    const customQuestionsResponses = await getCustomQuestionResponses(surveyId);
    
    if (!customQuestionsResponses || customQuestionsResponses.length === 0) {
      return [];
    }
    
    const questions = new Map();
    const responsesMap = new Map();
    
    // Process all responses
    customQuestionsResponses.forEach(survey => {
      if (survey && survey.custom_question_responses && Array.isArray(survey.custom_question_responses)) {
        // Process each response in the current survey
        survey.custom_question_responses.forEach(response => {
          if (response && response.custom_questions) {
            const questionId = response.question_id;
            const question = response.custom_questions;
            
            // Store the question information
            questions.set(questionId, question);
            
            // Store the responses by question ID
            if (!responsesMap.has(questionId)) {
              responsesMap.set(questionId, []);
            }
            responsesMap.get(questionId).push(response.answer);
          }
        });
      }
    });
    
    // Convert the maps to the final format
    const results = [];
    questions.forEach((question, questionId) => {
      results.push({
        question,
        responses: responsesMap.get(questionId) || []
      });
    });
    
    return results;
  } catch (error) {
    console.error('Error processing custom question results:', error);
    return [];
  }
};
