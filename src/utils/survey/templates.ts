import { supabase } from "../../lib/supabase";
import { SurveyTemplate, SurveyWithResponses } from "../types/survey";
import { countSurveyResponses } from "./responses";
import { isSurveyClosed } from "./status";

export const getSurveyById = async (id: string): Promise<SurveyTemplate | null> => {
  try {
    console.log(`Fetching survey template with ID: ${id}`);
    
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
    
    let query = supabase
      .from('survey_templates')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq('creator_id', userId);
    }
    
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
    
    const surveysWithResponses = await Promise.all(
      templates.map(async (template) => {
        const responseCount = await countSurveyResponses(template.id);
        return { ...template, responses: responseCount };
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
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todayStart = `${todayStr}T00:00:00.000Z`;
    const todayEnd = `${todayStr}T23:59:59.999Z`;
    
    const { data: closedSurveys, error } = await supabase
      .from('survey_templates')
      .select(`
        id,
        name,
        close_date,
        creator_id,
        profiles(
          email,
          first_name,
          last_name
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
    
    if (closedSurveys && closedSurveys.length > 0) {
      for (const survey of closedSurveys) {
        if (!survey.creator_id || !survey.profiles) {
          console.log(`Survey ${survey.id} has no creator, skipping notification`);
          continue;
        }
        
        const creatorProfile = Array.isArray(survey.profiles) 
          ? survey.profiles[0] 
          : survey.profiles;
        
        if (!creatorProfile || !creatorProfile.email) {
          console.log(`Survey ${survey.id} has no valid creator profile, skipping notification`);
          continue;
        }
        
        const creator = {
          id: survey.creator_id,
          email: creatorProfile.email,
          firstName: creatorProfile.first_name,
          lastName: creatorProfile.last_name
        };
        
        const baseUrl = window.location.origin;
        const analysisUrl = `${baseUrl}/analysis?id=${survey.id}`;
        
        console.log(`Sending closure notification for survey ${survey.id} to ${creator.email}`);
        
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
