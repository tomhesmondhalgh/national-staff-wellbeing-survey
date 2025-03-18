
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text'; 
  creator_id: string;
  archived: boolean;
  options?: string[] | null;
  created_at?: string;
}

// Helper function to convert database questions to our CustomQuestion type
export function convertToCustomQuestion(dbQuestion: any): CustomQuestion {
  return {
    id: dbQuestion.id,
    text: dbQuestion.text,
    type: 'text', // Force as 'text' type to match our interface
    creator_id: dbQuestion.creator_id,
    archived: !!dbQuestion.archived,
    options: dbQuestion.options || [],
    created_at: dbQuestion.created_at
  };
}

export function convertToCustomQuestions(dbQuestions: any[]): CustomQuestion[] {
  if (!Array.isArray(dbQuestions)) return [];
  return dbQuestions.map(convertToCustomQuestion);
}
