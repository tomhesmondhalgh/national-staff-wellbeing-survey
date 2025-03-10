
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';  // Using underscore format consistently
  options?: string[];
  creator_id: string;
  archived: boolean;
  created_at?: string;
}
