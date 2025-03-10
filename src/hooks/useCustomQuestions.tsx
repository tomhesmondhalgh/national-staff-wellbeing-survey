
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useSubscription } from './useSubscription';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasAccess } = useSubscription();

  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if user has access to custom questions feature
      const hasFeatureAccess = await hasAccess('foundation');
      if (!hasFeatureAccess) {
        return;
      }

      const query = supabase
        .from('custom_questions')
        .select('*')
        .eq('creator_id', user.id);
      
      if (!showArchived) {
        query.eq('archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching custom questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your custom questions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, toast, hasAccess]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      // Check if user has access to custom questions feature
      const hasFeatureAccess = await hasAccess('foundation');
      if (!hasFeatureAccess) {
        toast({
          title: 'Feature not available',
          description: 'Custom questions are only available in the Foundation plan and above.',
          variant: 'destructive'
        });
        return null;
      }

      const { data, error } = await supabase
        .from('custom_questions')
        .insert({
          ...question,
          creator_id: user.id,
          archived: false
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the local state with the new question
      setQuestions(prev => [data, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Custom question created successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating custom question:', error);
      toast({
        title: 'Error',
        description: 'Failed to create custom question. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('custom_questions')
        .update(updates)
        .eq('id', id)
        .eq('creator_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, ...updates } : q)
      );
      
      toast({
        title: 'Success',
        description: 'Custom question updated successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating custom question:', error);
      toast({
        title: 'Error',
        description: 'Failed to update custom question. Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const toggleArchiveQuestion = async (id: string, currentArchived: boolean) => {
    return updateQuestion(id, { archived: !currentArchived });
  };

  const toggleShowArchived = () => {
    setShowArchived(prev => !prev);
  };

  return {
    questions,
    isLoading,
    createQuestion,
    updateQuestion,
    toggleArchiveQuestion,
    showArchived,
    toggleShowArchived,
    refreshQuestions: fetchQuestions
  };
}
