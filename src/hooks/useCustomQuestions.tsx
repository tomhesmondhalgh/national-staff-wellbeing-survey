
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();

  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user has access to custom questions feature
      const hasFeatureAccess = await hasAccess('foundation');
      
      // In testing mode, we'll skip the access check
      if (!isTestingMode && !hasFeatureAccess) {
        setQuestions([]);
        return;
      }

      // Mock data for testing mode
      if (isTestingMode) {
        const mockQuestions: CustomQuestion[] = [
          {
            id: '1',
            text: 'How satisfied are you with the school facilities?',
            type: 'multiple-choice',
            options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
            archived: false,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            text: 'What improvements would you suggest for the school?',
            type: 'text',
            archived: false,
            created_at: new Date().toISOString()
          }
        ];
        setQuestions(mockQuestions);
        setIsLoading(false);
        return;
      }

      // Real data fetch for non-testing mode
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
    } catch (err) {
      console.error('Error fetching custom questions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch questions'));
      
      // Only show toast once, not for every retry
      if (!error) {
        toast({
          title: 'Error',
          description: 'Failed to load your custom questions. Please try again.',
          variant: 'destructive'
        });
      }
      
      // Set empty array to prevent endless loading state
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, toast, hasAccess, isTestingMode, error]);

  // Only run the effect when these dependencies change, not on every render
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      // Skip access check in testing mode
      if (!isTestingMode) {
        const hasFeatureAccess = await hasAccess('foundation');
        if (!hasFeatureAccess) {
          toast({
            title: 'Feature not available',
            description: 'Custom questions are only available in the Foundation plan and above.',
            variant: 'destructive'
          });
          return null;
        }
      }

      // In testing mode, create a mock question
      if (isTestingMode) {
        const mockQuestion: CustomQuestion = {
          id: Math.random().toString(36).substr(2, 9),
          ...question,
          archived: false,
          created_at: new Date().toISOString()
        };
        
        setQuestions(prev => [mockQuestion, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Custom question created successfully (Testing Mode)',
        });
        
        return mockQuestion;
      }

      // Actual database operation for non-testing mode
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
      // In testing mode, update mock question
      if (isTestingMode) {
        setQuestions(prev => 
          prev.map(q => q.id === id ? { ...q, ...updates } : q)
        );
        
        toast({
          title: 'Success',
          description: 'Custom question updated successfully (Testing Mode)',
        });
        
        return true;
      }

      // Actual database operation for non-testing mode
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
    error,
    createQuestion,
    updateQuestion,
    toggleArchiveQuestion,
    showArchived,
    toggleShowArchived,
    refreshQuestions: fetchQuestions
  };
}
