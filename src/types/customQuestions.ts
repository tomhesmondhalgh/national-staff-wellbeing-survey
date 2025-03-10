
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';  // Ensure consistent string literal types
  options?: string[];
  creator_id: string;
  archived: boolean;
  created_at?: string;
}
