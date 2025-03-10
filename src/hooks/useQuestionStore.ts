
import { useState } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { isValidQuestionType, createDbQuestionPayload } from '../utils/questionTypeUtils';

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

      const processedData = (data || []).map((question: CustomQuestion) => {
        if (!isValidQuestionType(question.type)) {
          console.warn(`Question ${question.id} has invalid type: ${question.type}. Converting to 'text'`);
          question.type = 'text';
        }
        return question;
      });
      
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
      
      const dbQuestion = {
        ...createDbQuestionPayload(question),
        creator_id: user.id,
        archived: false
      };
      
      console.log('Creating question with payload:', JSON.stringify(dbQuestion, null, 2));
      
      const { data, error } = await supabase
        .from('custom_questions')
        .insert(dbQuestion)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', error.details);
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
      console.log('Raw update data:', updates);
      
      const updateData: Partial<CustomQuestion> = {
        text: updates.text,
        type: 'text',
        archived: updates.archived
      };
      
      console.log('Sanitized update data:', updateData);

      const { error } = await supabase
        .from('custom_questions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          return { ...q, ...updateData };
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
