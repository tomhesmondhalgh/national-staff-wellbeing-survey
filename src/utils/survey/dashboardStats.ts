
import { supabase } from "../../lib/supabase";

/**
 * Calculates the benchmark score based on recommendation scores
 * @param surveyIds Array of survey IDs to calculate benchmark for
 * @returns The calculated benchmark score as a string
 */
export const calculateBenchmarkScore = async (surveyIds: string[]): Promise<string> => {
  try {
    if (!surveyIds.length) {
      return "0";
    }

    const { data: recommendationData, error: recommendationError } = await supabase
      .from('survey_responses')
      .select('recommendation_score')
      .in('survey_template_id', surveyIds)
      .not('recommendation_score', 'is', null);
    
    if (recommendationError) {
      console.error('Error fetching recommendation scores:', recommendationError);
      return "0";
    }

    if (!recommendationData || recommendationData.length === 0) {
      return "0";
    }

    const validScores = recommendationData
      .map(response => Number(response.recommendation_score))
      .filter(score => !isNaN(score) && score > 0);
    
    if (validScores.length === 0) {
      return "0";
    }
    
    const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return averageScore.toFixed(1);
  } catch (error) {
    console.error('Error calculating benchmark score:', error);
    return "0";
  }
};

export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found when fetching dashboard stats');
      return null;
    }
    
    const { count: surveyCount, error: surveyError } = await supabase
      .from('survey_templates')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id);
    
    if (surveyError) {
      console.error('Error counting surveys:', surveyError);
      return null;
    }
    
    console.log('Total surveys for this user:', surveyCount);
    
    const { data: userSurveys, error: userSurveysError } = await supabase
      .from('survey_templates')
      .select('id')
      .eq('creator_id', user.id);
      
    if (userSurveysError) {
      console.error('Error fetching user surveys:', userSurveysError);
      return null;
    }
    
    if (!userSurveys || userSurveys.length === 0) {
      return {
        totalSurveys: 0,
        totalRespondents: 0,
        responseRate: "0%",
        benchmarkScore: "0"
      };
    }
    
    const surveyIds = userSurveys.map(survey => survey.id);
    
    const { count: responseCount, error: responseError } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .in('survey_template_id', surveyIds)
      .eq('response_type', 'email');
    
    if (responseError) {
      console.error('Error counting responses:', responseError);
      return null;
    }
    
    console.log('Total email responses for this user\'s surveys:', responseCount);
    
    // Use the new function to calculate the benchmark score
    const benchmarkScore = await calculateBenchmarkScore(surveyIds);
    console.log('Calculated benchmark score:', benchmarkScore);
    
    const { data: surveyTemplates, error: templatesFetchError } = await supabase
      .from('survey_templates')
      .select('emails')
      .eq('creator_id', user.id)
      .not('emails', 'is', null)
      .not('emails', 'eq', '')
      .filter('date', 'lt', new Date().toISOString());
    
    if (templatesFetchError) {
      console.error('Error fetching templates for response rate:', templatesFetchError);
      return {
        totalSurveys: surveyCount || 0,
        totalRespondents: responseCount || 0,
        responseRate: "0%",
        benchmarkScore: benchmarkScore
      };
    }
    
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
    
    console.log('Total email recipients:', totalRecipients);
    
    let responseRate = 0;
    if (totalRecipients > 0) {
      responseRate = Math.round((responseCount / totalRecipients) * 100);
    }
    
    console.log('Calculated email response rate:', responseRate);
    
    return {
      totalSurveys: surveyCount || 0,
      totalRespondents: responseCount || 0,
      responseRate: `${responseRate}%`,
      benchmarkScore: benchmarkScore
    };
  } catch (error) {
    console.error('Unexpected error in getDashboardStats:', error);
    return null;
  }
};
