
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  options?: string[];
  creator_id: string;
  archived: boolean;
  created_at?: string;
}
