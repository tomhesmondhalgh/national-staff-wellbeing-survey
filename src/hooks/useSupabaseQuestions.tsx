
import { useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { CustomQuestion } from '../types/customQuestions';
import { toast } from 'sonner';

export function useSupabaseQuestions(showArchived: boolean, userId: string | undefined) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch questions from Supabase
  const fetchSupabaseQuestions = async () => {
    if (!userId) {
      setQuestions([]);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setHasError(false);
      
      // Build query
      let query = supabase
        .from('custom_questions')
        .select('*')
        .eq('creator_id', userId);
      
      if (!showArchived) {
        query = query.eq('archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
      setIsLoading(false);
      return data || [];
    } catch (error) {
      console.error('Error fetching questions from Supabase:', error);
      setHasError(true);
      toast.error('Failed to load questions');
      setIsLoading(false);
      return [];
    }
  };

  // Create a new question in Supabase
  const createSupabaseQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('custom_questions')
        .insert({
          ...question,
          creator_id: userId,
          archived: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Only update state if the question should be visible
      if (showArchived || !data.archived) {
        setQuestions(prev => [data, ...prev]);
      }
      
      toast.success('Custom question created successfully');
      return data;
    } catch (error) {
      console.error('Error creating question in Supabase:', error);
      toast.error('Failed to create custom question');
      return null;
    }
  };

  // Update an existing question in Supabase
  const updateSupabaseQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('custom_questions')
        .update(updates)
        .eq('id', id)
        .eq('creator_id', userId);
      
      if (error) throw error;
      
      // Update state
      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, ...updates } : q)
      );
      
      toast.success('Custom question updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating question in Supabase:', error);
      toast.error('Failed to update custom question');
      return false;
    }
  };

  return {
    questions,
    isLoading,
    hasError,
    fetchSupabaseQuestions,
    createSupabaseQuestion,
    updateSupabaseQuestion
  };
}
