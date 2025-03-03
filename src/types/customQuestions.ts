
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'dropdown';
  options: string[] | null;
  creator_id: string;
  created_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_id: string;
  created_at: string;
}

export interface CustomQuestionResponse {
  id: string;
  response_id: string;
  question_id: string;
  answer: string;
  created_at: string;
}
