
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Define the empty Group interface for backward compatibility
export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

// This hook is now deprecated as group tables have been removed from the database
export const useGroups = () => {
  const { user } = useAuth();
  const [groups] = useState<Group[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  
  console.warn('useGroups hook is deprecated as group tables have been removed from the database');

  return { groups, isLoading, error };
};
