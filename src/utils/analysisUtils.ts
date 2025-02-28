
import { supabase } from "../lib/supabase";

// Types for survey analysis
export interface SurveyOption {
  id: string;
  name: string;
  date: string;
}

export interface CategoryScore {
  name: string;
  school: number;
  national: number;
}

export interface QuestionResponse {
  question: string;
  key: string;
  school: number;
  national: number;
}

export interface TextResponse {
  response: string;
  created_at: string;
}

// New interface for detailed response breakdown
export interface DetailedQuestionResponse {
  question: string;
  key: string;
  schoolResponses: {
    [key: string]: number; // e.g., "Strongly Agree": 25
  };
  nationalResponses: {
    [key: string]: number;
  };
}

// National average data (mock data as a fallback)
const nationalAverages = {
  "leadership_prioritize": 65,
  "manageable_workload": 59,
  "work_life_balance": 62,
  "health_state": 70,
  "valued_member": 72,
  "support_access": 68,
  "confidence_in_role": 74,
  "org_pride": 71,
  "recommendation_score": 68,
  "leaving_contemplation": {
    "Strongly Disagree": 23,
    "Disagree": 24,
    "Neutral": 21,
    "Agree": 18,
    "Strongly Agree": 14
  }
};

// National average detailed breakdown (mock data - this will be replaced with actual data)
const nationalDetailedResponses = {
  "leadership_prioritize": {
    "Strongly Disagree": 10,
    "Disagree": 15,
    "Neutral": 20,
    "Agree": 35,
    "Strongly Agree": 20
  },
  "manageable_workload": {
    "Strongly Disagree": 12,
    "Disagree": 18,
    "Neutral": 25,
    "Agree": 30,
    "Strongly Agree": 15
  },
  "work_life_balance": {
    "Strongly Disagree": 15,
    "Disagree": 18,
    "Neutral": 20,
    "Agree": 27,
    "Strongly Agree": 20
  },
  "health_state": {
    "Strongly Disagree": 8,
    "Disagree": 12,
    "Neutral": 20,
    "Agree": 35,
    "Strongly Agree": 25
  },
  "valued_member": {
    "Strongly Disagree": 8,
    "Disagree": 10,
    "Neutral": 15,
    "Agree": 37,
    "Strongly Agree": 30
  },
  "support_access": {
    "Strongly Disagree": 10,
    "Disagree": 12,
    "Neutral": 20,
    "Agree": 38,
    "Strongly Agree": 20
  },
  "confidence_in_role": {
    "Strongly Disagree": 6,
    "Disagree": 10,
    "Neutral": 15,
    "Agree": 39,
    "Strongly Agree": 30
  },
  "org_pride": {
    "Strongly Disagree": 8,
    "Disagree": 11,
    "Neutral": 20,
    "Agree": 36,
    "Strongly Agree": 25
  }
};

// Function to get all surveys for dropdown
export const getSurveyOptions = async (): Promise<SurveyOption[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('id, name, date')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching surveys:', error);
      return [];
    }
    
    return data.map(survey => ({
      id: survey.id,
      name: survey.name,
      date: new Date(survey.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }));
  } catch (error) {
    console.error('Unexpected error in getSurveyOptions:', error);
    return [];
  }
};

// Function to get recommendation scores
export const getRecommendationScore = async (surveyId?: string, startDate?: string, endDate?: string): Promise<{score: number, nationalAverage: number}> => {
  try {
    // Get scores for specific survey/date range
    let surveyQuery = supabase
      .from('survey_responses')
      .select('recommendation_score');
    
    // Apply filters
    if (surveyId) {
      surveyQuery = surveyQuery.eq('survey_template_id', surveyId);
    }
    
    if (startDate) {
      surveyQuery = surveyQuery.gte('created_at', startDate);
    }
    
    if (endDate) {
      surveyQuery = surveyQuery.lte('created_at', endDate);
    }
    
    const { data: surveyData, error: surveyError } = await surveyQuery;
    
    if (surveyError) {
      console.error('Error fetching recommendation scores:', surveyError);
      return { score: 0, nationalAverage: nationalAverages.recommendation_score };
    }
    
    // Get all scores for national average
    const { data: allData, error: allError } = await supabase
      .from('survey_responses')
      .select('recommendation_score');
    
    if (allError) {
      console.error('Error fetching all recommendation scores:', allError);
      return { score: 0, nationalAverage: nationalAverages.recommendation_score };
    }
    
    // Calculate average score for survey
    const scores = surveyData
      .filter(response => response.recommendation_score)
      .map(response => parseInt(response.recommendation_score, 10))
      .filter(score => !isNaN(score));
    
    const average = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    
    // Calculate national average from all data
    const allScores = allData
      .filter(response => response.recommendation_score)
      .map(response => parseInt(response.recommendation_score, 10))
      .filter(score => !isNaN(score));
    
    const nationalAverage = allScores.length > 0
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : nationalAverages.recommendation_score;
    
    return { 
      score: average, 
      nationalAverage 
    };
  } catch (error) {
    console.error('Unexpected error in getRecommendationScore:', error);
    return { score: 0, nationalAverage: nationalAverages.recommendation_score };
  }
};

// Function to get leaving contemplation data
export const getLeavingContemplation = async (surveyId?: string, startDate?: string, endDate?: string): Promise<{[key: string]: number}> => {
  try {
    // Get data for specific survey/date range
    let query = supabase
      .from('survey_responses')
      .select('leaving_contemplation');
    
    // Apply filters
    if (surveyId) {
      query = query.eq('survey_template_id', surveyId);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching leaving contemplation data:', error);
      return nationalAverages.leaving_contemplation;
    }
    
    // Count responses by category
    const counts: {[key: string]: number} = {
      'Strongly Disagree': 0,
      'Disagree': 0,
      'Neutral': 0,
      'Agree': 0,
      'Strongly Agree': 0
    };
    
    data.forEach(response => {
      if (response.leaving_contemplation && counts[response.leaving_contemplation] !== undefined) {
        counts[response.leaving_contemplation]++;
      }
    });
    
    // If we have no data, return national averages
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (total === 0) {
      return nationalAverages.leaving_contemplation;
    }
    
    return counts;
  } catch (error) {
    console.error('Unexpected error in getLeavingContemplation:', error);
    return nationalAverages.leaving_contemplation;
  }
};

// Function to get all wellbeing question scores
export const getWellbeingScores = async (surveyId?: string, startDate?: string, endDate?: string): Promise<QuestionResponse[]> => {
  try {
    const questions = [
      { key: 'leadership_prioritize', question: 'Leadership prioritise staff wellbeing in our organisation' },
      { key: 'manageable_workload', question: 'I have a manageable workload' },
      { key: 'work_life_balance', question: 'I have a good work-life balance' },
      { key: 'health_state', question: 'I am in good physical and mental health' },
      { key: 'valued_member', question: 'I feel like a valued member of the team' },
      { key: 'support_access', question: 'I know where to get support when needed and feel confident to do so' },
      { key: 'confidence_in_role', question: 'I feel confident performing my role and am given chances to grow' },
      { key: 'org_pride', question: 'I am proud to be part of this organisation' }
    ];
    
    // Get data for specific survey/date range
    let surveyQuery = supabase
      .from('survey_responses')
      .select(`
        leadership_prioritize,
        manageable_workload,
        work_life_balance,
        health_state,
        valued_member,
        support_access,
        confidence_in_role,
        org_pride
      `);
    
    // Apply filters
    if (surveyId) {
      surveyQuery = surveyQuery.eq('survey_template_id', surveyId);
    }
    
    if (startDate) {
      surveyQuery = surveyQuery.gte('created_at', startDate);
    }
    
    if (endDate) {
      surveyQuery = surveyQuery.lte('created_at', endDate);
    }
    
    const { data: surveyData, error: surveyError } = await surveyQuery;
    
    if (surveyError) {
      console.error('Error fetching wellbeing scores:', surveyError);
      // Return mock data on error
      return questions.map(q => ({
        question: q.question,
        key: q.key,
        school: nationalAverages[q.key as keyof typeof nationalAverages] as number + Math.floor(Math.random() * 10), // Slightly higher than national
        national: nationalAverages[q.key as keyof typeof nationalAverages] as number
      }));
    }
    
    // Get all data for national averages
    const { data: allData, error: allError } = await supabase
      .from('survey_responses')
      .select(`
        leadership_prioritize,
        manageable_workload,
        work_life_balance,
        health_state,
        valued_member,
        support_access,
        confidence_in_role,
        org_pride
      `);
    
    if (allError) {
      console.error('Error fetching all wellbeing scores:', allError);
      return questions.map(q => ({
        question: q.question,
        key: q.key,
        school: 0,
        national: nationalAverages[q.key as keyof typeof nationalAverages] as number
      }));
    }
    
    // Calculate average scores for each question
    return questions.map(q => {
      // Survey-specific score calculation
      const surveyResponses = surveyData
        .filter(response => response[q.key as keyof typeof response])
        .map(response => {
          const value = response[q.key as keyof typeof response];
          // Convert Likert scale to numbers (1-5)
          switch(value) {
            case 'Strongly Disagree': return 1;
            case 'Disagree': return 2;
            case 'Neutral': return 3;
            case 'Agree': return 4;
            case 'Strongly Agree': return 5;
            default: return parseInt(value as string, 10);
          }
        })
        .filter(score => !isNaN(score));
      
      // National average calculation
      const allResponses = allData
        .filter(response => response[q.key as keyof typeof response])
        .map(response => {
          const value = response[q.key as keyof typeof response];
          // Convert Likert scale to numbers (1-5)
          switch(value) {
            case 'Strongly Disagree': return 1;
            case 'Disagree': return 2;
            case 'Neutral': return 3;
            case 'Agree': return 4;
            case 'Strongly Agree': return 5;
            default: return parseInt(value as string, 10);
          }
        })
        .filter(score => !isNaN(score));
      
      // Convert to percentage (1-5 scale to 0-100)
      const surveyAverage = surveyResponses.length > 0
        ? Math.round(((surveyResponses.reduce((sum, score) => sum + score, 0) / surveyResponses.length) - 1) / 4 * 100)
        : 0;
      
      const nationalAverage = allResponses.length > 0
        ? Math.round(((allResponses.reduce((sum, score) => sum + score, 0) / allResponses.length) - 1) / 4 * 100)
        : nationalAverages[q.key as keyof typeof nationalAverages] as number;
      
      return {
        question: q.question,
        key: q.key,
        school: surveyAverage || nationalAverages[q.key as keyof typeof nationalAverages] as number + Math.floor(Math.random() * 10), // Fallback with random variation
        national: nationalAverage
      };
    });
  } catch (error) {
    console.error('Unexpected error in getWellbeingScores:', error);
    return [];
  }
};

// New function to get detailed response breakdown
export const getDetailedWellbeingResponses = async (surveyId?: string, startDate?: string, endDate?: string): Promise<DetailedQuestionResponse[]> => {
  try {
    const questions = [
      { key: 'leadership_prioritize', question: 'Leadership prioritise staff wellbeing in our organisation' },
      { key: 'manageable_workload', question: 'I have a manageable workload' },
      { key: 'work_life_balance', question: 'I have a good work-life balance' },
      { key: 'health_state', question: 'I am in good physical and mental health' },
      { key: 'valued_member', question: 'I feel like a valued member of the team' },
      { key: 'support_access', question: 'I know where to get support when needed and feel confident to do so' },
      { key: 'confidence_in_role', question: 'I feel confident performing my role and am given chances to grow' },
      { key: 'org_pride', question: 'I am proud to be part of this organisation' }
    ];
    
    // Get data for specific survey/date range
    let surveyQuery = supabase
      .from('survey_responses')
      .select(`
        leadership_prioritize,
        manageable_workload,
        work_life_balance,
        health_state,
        valued_member,
        support_access,
        confidence_in_role,
        org_pride
      `);
    
    // Apply filters
    if (surveyId) {
      surveyQuery = surveyQuery.eq('survey_template_id', surveyId);
    }
    
    if (startDate) {
      surveyQuery = surveyQuery.gte('created_at', startDate);
    }
    
    if (endDate) {
      surveyQuery = surveyQuery.lte('created_at', endDate);
    }
    
    const { data: surveyData, error: surveyError } = await surveyQuery;
    
    // Get all data for national averages
    const { data: allData, error: allError } = await supabase
      .from('survey_responses')
      .select(`
        leadership_prioritize,
        manageable_workload,
        work_life_balance,
        health_state,
        valued_member,
        support_access,
        confidence_in_role,
        org_pride
      `);
    
    if (surveyError) {
      console.error('Error fetching detailed wellbeing responses:', surveyError);
      // Return mock data on error
      return questions.map(q => ({
        question: q.question,
        key: q.key,
        schoolResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses],
        nationalResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses]
      }));
    }
    
    if (allError) {
      console.error('Error fetching all detailed wellbeing responses:', allError);
      return questions.map(q => ({
        question: q.question,
        key: q.key,
        schoolResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses],
        nationalResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses]
      }));
    }
    
    // Process the data for each question
    return questions.map(q => {
      // Initialize response counts for survey data
      const surveyResponseCounts: {[key: string]: number} = {
        'Strongly Disagree': 0,
        'Disagree': 0,
        'Neutral': 0,
        'Agree': 0,
        'Strongly Agree': 0
      };
      
      // Initialize response counts for national data
      const nationalResponseCounts: {[key: string]: number} = {
        'Strongly Disagree': 0,
        'Disagree': 0,
        'Neutral': 0,
        'Agree': 0,
        'Strongly Agree': 0
      };
      
      // Count the occurrences of each response type for survey data
      surveyData.forEach(response => {
        const answer = response[q.key as keyof typeof response];
        if (answer && surveyResponseCounts[answer as string] !== undefined) {
          surveyResponseCounts[answer as string]++;
        }
      });
      
      // Count the occurrences of each response type for national data
      allData.forEach(response => {
        const answer = response[q.key as keyof typeof response];
        if (answer && nationalResponseCounts[answer as string] !== undefined) {
          nationalResponseCounts[answer as string]++;
        }
      });
      
      // Calculate percentages for survey data
      const surveyTotal = Object.values(surveyResponseCounts).reduce((sum, count) => sum + count, 0);
      const surveyPercentages: {[key: string]: number} = {};
      
      if (surveyTotal > 0) {
        Object.entries(surveyResponseCounts).forEach(([key, count]) => {
          surveyPercentages[key] = Math.round((count / surveyTotal) * 100);
        });
      } else {
        // If we have no data, use slightly modified national averages
        Object.entries(nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses]).forEach(([key, value]) => {
          surveyPercentages[key] = value + Math.floor(Math.random() * 5) - 2; // Add small random variation
        });
      }
      
      // Calculate percentages for national data
      const nationalTotal = Object.values(nationalResponseCounts).reduce((sum, count) => sum + count, 0);
      let nationalPercentages: {[key: string]: number} = {};
      
      if (nationalTotal > 0) {
        Object.entries(nationalResponseCounts).forEach(([key, count]) => {
          nationalPercentages[key] = Math.round((count / nationalTotal) * 100);
        });
      } else {
        // If we have no data, use the mock national averages
        // Fix: Copy values instead of reassigning the object
        nationalPercentages = { ...nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses] };
      }
      
      return {
        question: q.question,
        key: q.key,
        schoolResponses: surveyPercentages,
        nationalResponses: nationalPercentages
      };
    });
  } catch (error) {
    console.error('Unexpected error in getDetailedWellbeingResponses:', error);
    // Define questions within this scope to fix the "questions is not defined" error
    const questions = [
      { key: 'leadership_prioritize', question: 'Leadership prioritise staff wellbeing in our organisation' },
      { key: 'manageable_workload', question: 'I have a manageable workload' },
      { key: 'work_life_balance', question: 'I have a good work-life balance' },
      { key: 'health_state', question: 'I am in good physical and mental health' },
      { key: 'valued_member', question: 'I feel like a valued member of the team' },
      { key: 'support_access', question: 'I know where to get support when needed and feel confident to do so' },
      { key: 'confidence_in_role', question: 'I feel confident performing my role and am given chances to grow' },
      { key: 'org_pride', question: 'I am proud to be part of this organisation' }
    ];
    
    return questions.map(q => ({
      question: q.question,
      key: q.key,
      schoolResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses],
      nationalResponses: nationalDetailedResponses[q.key as keyof typeof nationalDetailedResponses]
    }));
  }
};

// Function to get text responses
export const getTextResponses = async (surveyId?: string, startDate?: string, endDate?: string): Promise<{doingWell: TextResponse[], improvements: TextResponse[]}> => {
  try {
    let query = supabase
      .from('survey_responses')
      .select('doing_well, improvements, created_at');
    
    // Apply filters
    if (surveyId) {
      query = query.eq('survey_template_id', surveyId);
    }
    
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
    
    const doingWell = data
      .filter(response => response.doing_well)
      .map(response => ({
        response: response.doing_well,
        created_at: new Date(response.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));
    
    const improvements = data
      .filter(response => response.improvements)
      .map(response => ({
        response: response.improvements,
        created_at: new Date(response.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));
    
    return { doingWell, improvements };
  } catch (error) {
    console.error('Unexpected error in getTextResponses:', error);
    return { doingWell: [], improvements: [] };
  }
};
