
export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text';  // Only text type now
  creator_id: string;
  archived: boolean;
  created_at?: string;
}
