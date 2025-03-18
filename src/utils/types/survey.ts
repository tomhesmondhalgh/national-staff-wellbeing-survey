
// Define the SurveyTemplate interface
export interface SurveyTemplate {
  id: string;
  name: string;
  date: string;
  close_date?: string | null;
  creator_id?: string;
  emails?: string;
  status?: 'Saved' | 'Scheduled' | 'Sent' | 'Completed' | 'Archived';
  created_at?: string;
}

// Define the SurveyWithResponses interface, extending SurveyTemplate
export interface SurveyWithResponses extends SurveyTemplate {
  responses: number;
}
