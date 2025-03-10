
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
      console.log(`Fetching questions (showArchived=${showArchived})`);
      
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

      console.log('Raw questions from database:', data);
      
      // Use data directly without conversion
      const processedData = data || [] as CustomQuestion[];
      
      console.log('Fetched questions after processing:', processedData);
      setQuestions(processedData);
      return processedData;
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Log the exact type value being used
      console.log(`Creating question with type: ${question.type}`);
      
      // Check if the type is one of the allowed values
      if (question.type !== 'text' && question.type !== 'multiple_choice') {
        console.error(`Invalid question type: ${question.type}. Must be 'text' or 'multiple_choice'`);
        throw new Error('Invalid question type');
      }
      
      const dbQuestion = {
        ...question,
        creator_id: user.id,
        archived: false
      };
      
      console.log('Creating question with data:', dbQuestion);
      
      const { data, error } = await supabase
        .from('custom_questions')
        .insert(dbQuestion)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('New question created:', data);
      setQuestions(prev => [data, ...prev]);
      toast.success('Question created successfully');
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<CustomQuestion>) => {
    try {
      console.log('Updating question with data:', updates);

      const { error } = await supabase
        .from('custom_questions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          // Create a new question object with updates
          return { ...q, ...updates };
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
