
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
  
  // Add a local storage key for test questions
  const TEST_QUESTIONS_KEY = 'test_custom_questions';

  const fetchQuestions = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime < 1000) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    
    setLastFetchTime(now);
    
    if (!user) {
      console.log('No user found, skipping custom questions fetch');
      setIsLoading(false);
      setQuestions([]);
      return;
    }

    if (isLoading === false) {
      setIsLoading(true);
    }
    
    try {
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
        console.log('Using test mode for custom questions');
        // Initialize with empty array if nothing in localStorage
        let storedQuestions: CustomQuestion[] = [];
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          if (storedData) {
            storedQuestions = JSON.parse(storedData);
            console.log(`Retrieved ${storedQuestions.length} questions from localStorage`);
          } else {
            // Initialize empty array in localStorage if not exists
            localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
          }
        } catch (error) {
          console.error('Error parsing stored questions:', error);
        }
        
        // Filter based on showArchived flag, just like we would with real data
        const filteredQuestions = showArchived 
          ? storedQuestions 
          : storedQuestions.filter(q => !q.archived);
        
        console.log(`Filtered to ${filteredQuestions.length} questions (showArchived: ${showArchived})`);
        setQuestions(filteredQuestions);
        setIsLoading(false);
        return;
      }

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
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, toast, hasAccess, isTestingMode, lastFetchTime, isLoading]);

  useEffect(() => {
    console.log('useCustomQuestions effect running, showArchived:', showArchived);
    fetchQuestions();
  }, [user, showArchived, isTestingMode, fetchQuestions]);

  // Helper function to save test questions to localStorage
  const saveTestQuestions = (updatedQuestions: CustomQuestion[]) => {
    if (isTestingMode) {
      try {
        localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
        console.log(`Saved ${updatedQuestions.length} questions to localStorage`);
      } catch (error) {
        console.error('Error saving questions to localStorage:', error);
      }
    }
  };

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
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
        const newQuestion: CustomQuestion = {
          id: Date.now().toString(),
          ...question,
          creator_id: user.id,
          archived: false,
          created_at: new Date().toISOString()
        };
        
        const updatedQuestions = [newQuestion, ...questions];
        setQuestions(updatedQuestions);
        saveTestQuestions(updatedQuestions);
        
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
        const updatedQuestions = questions.map(q => 
          q.id === id ? { ...q, ...updates } : q
        );
        setQuestions(updatedQuestions);
        saveTestQuestions(updatedQuestions);
        
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

  const toggleShowArchived = useCallback(() => {
    console.log('Toggling show archived from', showArchived, 'to', !showArchived);
    setShowArchived(prev => !prev);
  }, [showArchived]);

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
