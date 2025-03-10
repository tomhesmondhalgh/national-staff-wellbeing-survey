
import { useState } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Define literal types explicitly
type DatabaseQuestionType = 'text' | 'multiple_choice';
type FrontendQuestionType = 'text' | 'multiple-choice';

// Type-safe conversion functions
const toDbFormat = (type: FrontendQuestionType): DatabaseQuestionType => {
  if (type === 'multiple-choice') return 'multiple_choice';
  return 'text';
};

const toFrontendFormat = (type: DatabaseQuestionType): FrontendQuestionType => {
  if (type === 'multiple_choice') return 'multiple-choice';
  return 'text';
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
      
      // Create a properly typed database question object
      const dbQuestion = {
        ...question,
        type: toDbFormat(question.type as FrontendQuestionType),
        creator_id: user.id,
        archived: false
      };
      
      const { data, error } = await supabase
        .from('custom_questions')
        .insert(dbQuestion)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Fix: Cast the type properly before returning
      const newQuestion: CustomQuestion = {
        ...data,
        type: toFrontendFormat(data.type as DatabaseQuestionType)
      };
      
      setQuestions(prev => [newQuestion, ...prev]);
      toast.success('Question created successfully');
      return newQuestion;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<CustomQuestion>) => {
    try {
      const dbUpdates = { ...updates };
      
      if (updates.type) {
        dbUpdates.type = toDbFormat(updates.type as FrontendQuestionType);
      }

      const { error } = await supabase
        .from('custom_questions')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          const updatedQuestion = { ...q, ...updates };
          
          // Ensure type is correctly formatted when returning to frontend
          if (dbUpdates.type) {
            updatedQuestion.type = toFrontendFormat(dbUpdates.type as DatabaseQuestionType);
          }
          
          return updatedQuestion;
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
