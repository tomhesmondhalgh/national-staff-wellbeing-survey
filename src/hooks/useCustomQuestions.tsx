
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();

  const fetchQuestions = useCallback(async () => {
    // Prevent duplicate fetches within a short time window
    const now = Date.now();
    if (now - lastFetchTime < 1000) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    
    setLastFetchTime(now);
    
    if (!user) {
      console.log('No user found, skipping custom questions fetch');
      setIsLoading(false);
      return;
    }

    if (isLoading === false) {
      setIsLoading(true);
    }
    
    try {
      // Check if user has access to custom questions feature
      const hasFeatureAccess = await hasAccess('foundation');
      console.log('User has access to foundation plan:', hasFeatureAccess);
      
      if (!hasFeatureAccess && !isTestingMode) {
        console.log('User does not have access to custom questions feature');
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      console.log('Fetching custom questions for user:', user.id);
      console.log('Show archived:', showArchived);
      console.log('Is testing mode:', isTestingMode);

      if (isTestingMode) {
        // In testing mode, return mock data
        console.log('Using mock data in testing mode');
        const mockQuestions: CustomQuestion[] = [
          {
            id: '1',
            text: 'How would you rate our school facilities?',
            type: 'multiple-choice',
            options: ['Excellent', 'Good', 'Average', 'Poor'],
            archived: false,
            creator_id: user.id
          },
          {
            id: '2',
            text: 'What improvements would you suggest for our curriculum?',
            type: 'text',
            archived: false,
            creator_id: user.id
          }
        ];
        setQuestions(mockQuestions);
        setIsLoading(false);
        return;
      }

      // Build the query for real data
      let query = supabase
        .from('custom_questions')
        .select('*')
        .eq('creator_id', user.id);
      
      if (!showArchived) {
        query = query.eq('archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching custom questions:', error);
        throw error;
      }
      
      console.log('Custom questions fetched:', data?.length || 0);
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching custom questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your custom questions. Please try again.',
        variant: 'destructive'
      });
      // Set empty array to prevent UI from waiting indefinitely
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, toast, hasAccess, isTestingMode, lastFetchTime, isLoading]);

  useEffect(() => {
    console.log('useCustomQuestions effect running');
    fetchQuestions();
    // Don't include fetchQuestions in dependencies to prevent infinite loop
  }, [user, showArchived, isTestingMode]);

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      // Check if user has access to custom questions feature
      const hasFeatureAccess = await hasAccess('foundation');
      if (!hasFeatureAccess && !isTestingMode) {
        toast({
          title: 'Feature not available',
          description: 'Custom questions are only available in the Foundation plan and above.',
          variant: 'destructive'
        });
        return null;
      }

      if (isTestingMode) {
        // Mock creation in testing mode
        const newQuestion: CustomQuestion = {
          id: Date.now().toString(),
          ...question,
          creator_id: user.id,
          archived: false
        };
        
        setQuestions(prev => [newQuestion, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Custom question created successfully (Testing Mode)',
        });
        
        return newQuestion;
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
        console.error('Error creating custom question:', error);
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
      if (isTestingMode) {
        // Mock update in testing mode
        setQuestions(prev => 
          prev.map(q => q.id === id ? { ...q, ...updates } : q)
        );
        
        toast({
          title: 'Success',
          description: 'Custom question updated successfully (Testing Mode)',
        });
        
        return true;
      }

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
