import { supabase } from "../lib/supabase";

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

// Function to process custom question results
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

// Function to get custom question responses for a particular survey
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
