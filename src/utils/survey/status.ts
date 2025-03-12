
import { SurveyTemplate } from "../types/survey";

/**
 * Determines if a survey is closed based on its close date
 * 
 * @param survey - The survey template to check
 * @returns Whether the survey is closed or not
 */
export const isSurveyClosed = (survey: SurveyTemplate): boolean => {
  if (!survey.close_date) return false;
  return new Date(survey.close_date) < new Date();
};

/**
 * Determines the survey status based on dates
 * 
 * @param dateStr - The survey date
 * @param closeDateStr - The survey close date (optional)
 * @returns The status of the survey
 */
export const getSurveyStatus = (dateStr: string, closeDateStr?: string | null): 'Scheduled' | 'Sent' | 'Completed' => {
  const now = new Date();
  const surveyDate = new Date(dateStr);
  const closeDate = closeDateStr ? new Date(closeDateStr) : null;
  
  if (surveyDate > now) {
    return 'Scheduled';
  } else if (closeDate && closeDate < now) {
    return 'Completed';
  } else {
    return 'Sent';
  }
};
