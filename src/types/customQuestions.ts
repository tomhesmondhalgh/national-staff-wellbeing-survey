
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  options?: string[];
  created_at?: string;
  archived: boolean;
}

export interface CustomQuestionResponse {
  id: string;
  question_id: string;
  response_id: string;
  answer: string;
  survey_id: string;
  created_at?: string;
}

export interface SurveyCustomQuestion {
  id: string;
  survey_id: string;
  question_id: string;
  created_at?: string;
}
