
import { supabase } from "../lib/supabase";
import { getUserCustomQuestions } from "../utils/customQuestionsUtils";

export interface SurveyTemplate {
  id: string;
  name: string;
  date: string;
  close_date?: string;
  creator_id?: string;
  created_at: string;
  updated_at: string;
  status: 'Scheduled' | 'Sent' | 'Completed';
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyWithResponses extends SurveyTemplate {
  responses: number;
}

export const createSurvey = async (formData: {
  name: string;
  date: Date;
  closeDate?: Date;
  recipients?: string;
}, userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .insert({
        name: formData.name.trim(),
        date: formData.date.toISOString(),
        close_date: formData.closeDate ? formData.closeDate.toISOString() : null,
        emails: formData.recipients?.trim() || '',
        creator_id: userId
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating survey:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Unexpected error in createSurvey:', error);
    return null;
  }
};

export const sendSurveyEmails = async (
  surveyId: string, 
  surveyName: string, 
  emails: string[],
  surveyUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-survey-email', {
      body: {
        surveyId,
        surveyName,
        emails,
        surveyUrl,
        isReminder: false
      }
    });
    
    if (error) {
      console.error('Error sending survey emails:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in sendSurveyEmails:', error);
    return false;
  }
};

export const getSurveyById = async (id: string): Promise<SurveyTemplate | null> => {
  try {
    console.log(`Fetching survey template with ID: ${id}`);
    
    // Use a direct fetch with RLS bypass option for public survey templates
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching survey template:', error);
      return null;
    }
    
    if (!data) {
      console.error('No survey template found with ID:', id);
      return null;
    }
    
    console.log('Survey template found:', data);
    return data as SurveyTemplate;
  } catch (error) {
    console.error('Unexpected error in getSurveyById:', error);
    return null;
  }
};

export const isSurveyClosed = (survey: SurveyTemplate): boolean => {
  if (!survey.close_date) return false;
  return new Date(survey.close_date) < new Date();
};

export const getAllSurveyTemplates = async (): Promise<SurveyTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('survey_templates')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching survey templates:', error);
      return [];
    }
    
    return data as SurveyTemplate[];
  } catch (error) {
    console.error('Unexpected error in getAllSurveyTemplates:', error);
    return [];
  }
};

export const getRecentSurveys = async (limit: number = 3, userId?: string): Promise<SurveyWithResponses[]> => {
  try {
    console.log(`Fetching recent surveys, limit: ${limit}, userId: ${userId}`);
    
    // Build the query
    let query = supabase
      .from('survey_templates')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    
    // If userId is provided, filter by creator_id
    if (userId) {
      query = query.eq('creator_id', userId);
    }
    
    // Execute the query
    const { data: templates, error: templatesError } = await query;
    
    if (templatesError) {
      console.error('Error fetching recent surveys:', templatesError);
      return [];
    }
    
    console.log('Templates fetched:', templates);
    
    if (!templates || templates.length === 0) {
      console.log('No templates found');
      return [];
    }
    
    // For each template, count the responses
    const surveysWithResponses = await Promise.all(
      templates.map(async (template) => {
        console.log(`Counting responses for survey ${template.id}`);
        const { count, error: countError } = await supabase
          .from('survey_responses')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', template.id);
        
        if (countError) {
          console.error(`Error counting responses for survey ${template.id}:`, countError);
          return { ...template, responses: 0 };
        }
        
        console.log(`Responses for survey ${template.id}:`, count);
        return { ...template, responses: count || 0 };
      })
    );
    
    console.log('Surveys with responses:', surveysWithResponses);
    return surveysWithResponses as SurveyWithResponses[];
  } catch (error) {
    console.error('Unexpected error in getRecentSurveys:', error);
    return [];
  }
};

export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats');
    
    // Get total number of surveys
    const { count: surveyCount, error: surveyError } = await supabase
      .from('survey_templates')
      .select('*', { count: 'exact', head: true });
    
    if (surveyError) {
      console.error('Error counting surveys:', surveyError);
      return null;
    }
    
    console.log('Total surveys:', surveyCount);
    
    // Get total number of respondents
    const { count: responseCount, error: responseError } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true });
    
    if (responseError) {
      console.error('Error counting responses:', responseError);
      return null;
    }
    
    console.log('Total responses:', responseCount);
    
    // Calculate benchmark score based on recommendation scores
    const { data: recommendationData, error: recommendationError } = await supabase
      .from('survey_responses')
      .select('recommendation_score')
      .not('recommendation_score', 'is', null);
    
    let benchmarkScore = "0";
    
    if (recommendationError) {
      console.error('Error fetching recommendation scores:', recommendationError);
    } else if (recommendationData && recommendationData.length > 0) {
      // Calculate average recommendation score
      const validScores = recommendationData
        .map(response => Number(response.recommendation_score))
        .filter(score => !isNaN(score) && score > 0);
      
      if (validScores.length > 0) {
        const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        benchmarkScore = averageScore.toFixed(1);
        console.log('Calculated benchmark score from recommendation data:', benchmarkScore);
      }
    }
    
    // Get total number of recipients from emails field (to calculate response rate properly)
    const { data: surveyTemplates, error: templatesFetchError } = await supabase
      .from('survey_templates')
      .select('emails')
      .not('emails', 'is', null)
      .not('emails', 'eq', '')
      .filter('date', 'lt', new Date().toISOString()); // Only include surveys that have been sent (past date)
    
    if (templatesFetchError) {
      console.error('Error fetching templates for response rate:', templatesFetchError);
      // Fall back to simplified calculation if we can't get the email data
      const avgResponsesPerSurvey = surveyCount ? Math.round((responseCount / surveyCount) * 100) / 100 : 0;
      const fallbackResponseRate = Math.min(Math.round(avgResponsesPerSurvey * 10), 100);
      
      return {
        totalSurveys: surveyCount || 0,
        totalRespondents: responseCount || 0,
        responseRate: `${fallbackResponseRate}%`,
        benchmarkScore: benchmarkScore // Now using the calculated benchmark score
      };
    }
    
    // Count total recipients (each email address in the comma-separated list)
    let totalRecipients = 0;
    if (surveyTemplates && surveyTemplates.length > 0) {
      console.log('Calculating total recipients from sent surveys');
      
      surveyTemplates.forEach(template => {
        if (template.emails) {
          const emailsArray = template.emails
            .split(',')
            .map(email => email.trim())
            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
          
          totalRecipients += emailsArray.length;
        }
      });
    }
    
    console.log('Total recipients:', totalRecipients);
    
    // Calculate actual response rate based on recipients
    let responseRate = 0;
    if (totalRecipients > 0) {
      responseRate = Math.round((responseCount / totalRecipients) * 100);
    } else {
      // Fallback if no recipients found
      responseRate = surveyCount ? Math.min(Math.round((responseCount / surveyCount) * 20), 100) : 0;
    }
    
    console.log('Calculated response rate:', responseRate);
    
    const stats = {
      totalSurveys: surveyCount || 0,
      totalRespondents: responseCount || 0,
      responseRate: `${responseRate}%`,
      benchmarkScore: benchmarkScore
    };
    
    console.log('Calculated stats:', stats);
    return stats;
  } catch (error) {
    console.error('Unexpected error in getDashboardStats:', error);
    return null;
  }
};

// Get a survey with its custom questions
export const getSurveyWithCustomQuestions = async (id: string): Promise<any> => {
  try {
    console.log(`Fetching survey template with ID: ${id} and its custom questions`);
    
    // First, get the survey template
    const survey = await getSurveyById(id);
    
    if (!survey) {
      return null;
    }
    
    // Then, get the custom questions
    const customQuestions = await getSurveyCustomQuestions(id);
    
    return {
      ...survey,
      customQuestions
    };
  } catch (error) {
    console.error('Unexpected error in getSurveyWithCustomQuestions:', error);
    return null;
  }
};

// Add the missing getSurveyCustomQuestions function
export const getSurveyCustomQuestions = async (surveyId: string) => {
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
    
    // Extract just the custom questions from the join
    return data?.map(item => item.custom_questions) || [];
  } catch (error) {
    console.error('Error in getSurveyCustomQuestions:', error);
    return [];
  }
};

// Process custom question data for analysis
export const getCustomQuestionAnalysis = async (surveyId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('custom_question_responses')
      .select(`
        question_id,
        answer,
        custom_questions (
          id,
          text,
          type,
          options
        )
      `)
      .eq('survey_id', surveyId);
    
    if (error) {
      console.error('Error fetching custom question analysis:', error);
      return [];
    }
    
    // Group responses by question
    const questionResponsesMap = new Map();
    
    data.forEach(response => {
      const questionId = response.question_id;
      const answer = response.answer;
      const question = response.custom_questions;
      
      if (!questionResponsesMap.has(questionId)) {
        questionResponsesMap.set(questionId, {
          question: question,
          responses: []
        });
      }
      
      questionResponsesMap.get(questionId).responses.push(answer);
    });
    
    // Convert map to array
    return Array.from(questionResponsesMap.values());
  } catch (error) {
    console.error('Unexpected error in getCustomQuestionAnalysis:', error);
    return [];
  }
};

export const getSurveyWithResponses = async (surveyId) => {
  try {
    // Get survey data
    const { data: survey, error: surveyError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('id', surveyId)
      .single();
    
    if (surveyError) {
      console.error('Error fetching survey:', surveyError);
      return null;
    }
    
    // Get custom questions
    const customQuestions = await getUserCustomQuestions();
    
    // Get survey responses
    const { data: responses, error: responsesError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_template_id', surveyId);
    
    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return { ...survey, responses: [] };
    }
    
    return {
      ...survey,
      responses: responses || [],
      customQuestions: customQuestions || []
    };
  } catch (error) {
    console.error('Error in getSurveyWithResponses:', error);
    return null;
  }
};
