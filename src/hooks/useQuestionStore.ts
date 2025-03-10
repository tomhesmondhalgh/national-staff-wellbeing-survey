
import { useState } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useQuestionStore() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async (showArchived: boolean = false) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load questions');
        return [];
      }

      // Set empty array if no data returned
      setQuestions(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('Failed to load questions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>) => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // First, ensure we're passing the proper type value as expected by the database
      const typeValue = question.type === 'multiple-choice' ? 'multiple_choice' : 'text';
      
      const { data, error } = await supabase
        .from('custom_questions')
        .insert({ 
          ...question,
          type: typeValue, // Use the sanitized type value
          creator_id: user.id, // Use the current user's ID
          archived: false 
        })
        .select()
        .single();

      if (error) throw error;
      
      // When adding to state, convert back to our frontend format if needed
      const processedData = {
        ...data,
        type: data.type === 'multiple_choice' ? 'multiple-choice' : data.type
      };
      
      setQuestions(prev => [processedData, ...prev]);
      toast.success('Question created successfully');
      return processedData;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<CustomQuestion>) => {
    try {
      // If the type is being updated, ensure it's in the right format for the database
      const sanitizedUpdates = { ...updates };
      if (updates.type) {
        sanitizedUpdates.type = updates.type === 'multiple-choice' ? 'multiple_choice' : updates.type;
      }

      const { error } = await supabase
        .from('custom_questions')
        .update(sanitizedUpdates)
        .eq('id', id);

      if (error) throw error;
      
      // Update in the local state with our frontend format
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          const updated = { ...q, ...updates };
          // Make sure the type is in the frontend format
          if (updates.type) {
            updated.type = updates.type;
          }
          return updated;
        }
        return q;
      }));
      
      toast.success('Question updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
      return false;
    }
  };

  return {
    questions,
    isLoading,
    fetchQuestions,
    createQuestion,
    updateQuestion
  };
}
