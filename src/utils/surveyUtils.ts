
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

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

export const checkForClosedSurveys = async () => {
  try {
    console.log('Checking for surveys that have recently closed');
    
    // Get current date in ISO format
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get the date range for today (start and end of the day)
    const todayStart = `${todayStr}T00:00:00.000Z`;
    const todayEnd = `${todayStr}T23:59:59.999Z`;
    
    // Find surveys that closed today (close_date is between start and end of today)
    const { data: closedSurveys, error } = await supabase
      .from('survey_templates')
      .select(`
        id,
        name,
        close_date,
        creator_id,
        profiles(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('close_date', todayStart)
      .lte('close_date', todayEnd)
      .not('creator_id', 'is', null)
      .not('close_date', 'is', null);
    
    if (error) {
      console.error('Error fetching closed surveys:', error);
      return;
    }
    
    console.log(`Found ${closedSurveys?.length || 0} surveys that closed today:`, closedSurveys);
    
    // For each closed survey, send a notification to the creator
    if (closedSurveys && closedSurveys.length > 0) {
      for (const survey of closedSurveys) {
        // Skip if there's no creator
        if (!survey.creator_id || !survey.profiles) {
          console.log(`Survey ${survey.id} has no creator, skipping notification`);
          continue;
        }
        
        const creator = {
          id: survey.creator_id,
          email: survey.profiles.email,
          firstName: survey.profiles.first_name,
          lastName: survey.profiles.last_name
        };
        
        // Generate the analysis URL
        const baseUrl = window.location.origin;
        const analysisUrl = `${baseUrl}/analysis?id=${survey.id}`;
        
        console.log(`Sending closure notification for survey ${survey.id} to ${creator.email}`);
        
        // Call the Edge Function to send the notification
        const { data, error: notificationError } = await supabase.functions.invoke('send-closure-notification', {
          body: {
            surveyId: survey.id,
            surveyName: survey.name,
            creator: creator,
            analysisUrl: analysisUrl
          }
        });
        
        if (notificationError) {
          console.error(`Error sending closure notification for survey ${survey.id}:`, notificationError);
        } else {
          console.log(`Closure notification sent for survey ${survey.id}:`, data);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error in checkForClosedSurveys:', error);
  }
};

export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats');
    
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found when fetching dashboard stats');
      return null;
    }
    
    // Get total number of surveys for this user only
    const { count: surveyCount, error: surveyError } = await supabase
      .from('survey_templates')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id);
    
    if (surveyError) {
      console.error('Error counting surveys:', surveyError);
      return null;
    }
    
    console.log('Total surveys for this user:', surveyCount);
    
    // Get total number of respondents for surveys created by this user
    const { data: userSurveys, error: userSurveysError } = await supabase
      .from('survey_templates')
      .select('id')
      .eq('creator_id', user.id);
      
    if (userSurveysError) {
      console.error('Error fetching user surveys:', userSurveysError);
      return null;
    }
    
    // If user has no surveys, return zero counts
    if (!userSurveys || userSurveys.length === 0) {
      return {
        totalSurveys: 0,
        totalRespondents: 0,
        responseRate: "0%",
        benchmarkScore: "0"
      };
    }
    
    // Extract just the IDs for the IN clause
    const surveyIds = userSurveys.map(survey => survey.id);
    
    // Count responses only for surveys created by this user
    const { count: responseCount, error: responseError } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .in('survey_template_id', surveyIds);
    
    if (responseError) {
      console.error('Error counting responses:', responseError);
      return null;
    }
    
    console.log('Total responses for this user\'s surveys:', responseCount);
    
    // Calculate benchmark score based on recommendation scores for this user's surveys
    const { data: recommendationData, error: recommendationError } = await supabase
      .from('survey_responses')
      .select('recommendation_score')
      .in('survey_template_id', surveyIds)
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
      .eq('creator_id', user.id)
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
        benchmarkScore: benchmarkScore
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
