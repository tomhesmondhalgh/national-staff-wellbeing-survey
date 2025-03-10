
import { useState } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Define the database format for question types
type DatabaseQuestionType = 'text' | 'multiple_choice';

// Helper functions to convert between formats
const toDbFormat = (type: 'text' | 'multiple-choice'): DatabaseQuestionType => {
  return type === 'multiple-choice' ? 'multiple_choice' : 'text';
};

const toFrontendFormat = (type: DatabaseQuestionType): 'text' | 'multiple-choice' => {
  return type === 'multiple_choice' ? 'multiple-choice' : 'text';
};

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

      // Convert database format to frontend format
      const processedData = (data || []).map(q => ({
        ...q,
        type: toFrontendFormat(q.type as DatabaseQuestionType)
      })) as CustomQuestion[];

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
      
      // Convert frontend format to database format
      const dbQuestion = {
        ...question,
        type: toDbFormat(question.type),
        creator_id: user.id,
        archived: false
      };
      
      console.log('Sending to database:', dbQuestion);
      
      const { data, error } = await supabase
        .from('custom_questions')
        .insert(dbQuestion)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // Convert back to frontend format
      const processedData = {
        ...data,
        type: toFrontendFormat(data.type as DatabaseQuestionType)
      } as CustomQuestion;
      
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
      // Convert to database format for the type field if it exists
      const dbUpdates = {
        ...updates
      };
      
      if (updates.type) {
        dbUpdates.type = toDbFormat(updates.type);
      }

      const { error } = await supabase
        .from('custom_questions')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      
      // Update state with frontend format
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          return {
            ...q,
            ...updates, // Use original updates with frontend format
          };
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
