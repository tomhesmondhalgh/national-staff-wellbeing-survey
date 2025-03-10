import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';
import { toast } from 'sonner';

const TEST_QUESTIONS_KEY = 'test_custom_questions';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { toast: uiToast } = useToast();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();
  
  useEffect(() => {
    if (isTestingMode) {
      try {
        const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
        if (!storedData) {
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
          console.log('Initialized empty questions array in localStorage for testing mode');
        }
      } catch (error) {
        console.error('Error initializing localStorage for testing mode:', error);
      }
    }
  }, [isTestingMode]);
  
  const fetchQuestions = useCallback(async () => {
    try {
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

      setIsLoading(true);
      setHasError(false);
      
      let hasFeatureAccess = false;
      try {
        hasFeatureAccess = await hasAccess('foundation');
        console.log('User has access to foundation plan:', hasFeatureAccess);
      } catch (accessError) {
        console.error('Error checking feature access:', accessError);
        // Continue with default false value
      }
      
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
        let storedQuestions: CustomQuestion[] = [];
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          if (storedData) {
            storedQuestions = JSON.parse(storedData);
            console.log(`Retrieved ${storedQuestions.length} questions from localStorage`);
          } else {
            localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
          }
        } catch (error) {
          console.error('Error parsing stored questions:', error);
          // Continue with empty array
        }
        
        const filteredQuestions = showArchived 
          ? storedQuestions 
          : (storedQuestions || []).filter(q => !q.archived);
        
        console.log(`Filtered to ${filteredQuestions.length} questions (showArchived: ${showArchived})`);
        setQuestions(filteredQuestions || []);
        setIsLoading(false);
        return;
      }

      try {
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
      } catch (dbError) {
        console.error('Database query error:', dbError);
        toast.error('Failed to load questions');
        setHasError(true);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching custom questions:', error);
      toast.error('Failed to load custom questions');
      setHasError(true);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, uiToast, hasAccess, isTestingMode, lastFetchTime]);

  useEffect(() => {
    console.log('useCustomQuestions effect running, showArchived:', showArchived);
    fetchQuestions().catch(error => {
      console.error('Error in fetchQuestions effect:', error);
      setIsLoading(false);
      setHasError(true);
      setQuestions([]);
    });
  }, [user, showArchived, isTestingMode, fetchQuestions]);

  const saveTestQuestions = (updatedQuestions: CustomQuestion[]) => {
    if (isTestingMode) {
      try {
        localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
        console.log(`Saved ${updatedQuestions.length} questions to localStorage`);
      } catch (error) {
        console.error('Error saving questions to localStorage:', error);
        toast.error('Failed to save questions to local storage');
      }
    }
  };

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      let hasFeatureAccess = false;
      try {
        hasFeatureAccess = await hasAccess('foundation');
      } catch (error) {
        console.error('Error checking feature access:', error);
        // Continue with default false
      }
      
      if (!hasFeatureAccess && !isTestingMode) {
        toast.error('Custom questions are only available in the Foundation plan and above');
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
        
        const currentQuestions = questions || [];
        const updatedQuestions = [newQuestion, ...currentQuestions];
        setQuestions(updatedQuestions);
        saveTestQuestions(updatedQuestions);
        
        toast.success('Custom question created successfully (Testing Mode)');
        
        return newQuestion;
      }

      try {
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
        
        const currentQuestions = questions || [];
        setQuestions([data, ...currentQuestions]);
        
        toast.success('Custom question created successfully');
        
        return data;
      } catch (dbError) {
        console.error('Database error creating question:', dbError);
        toast.error('Error connecting to the database. Please try again later.');
        return null;
      }
    } catch (error) {
      console.error('Error creating custom question:', error);
      toast.error('Failed to create custom question. Please try again.');
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!user) return false;
    
    try {
      if (isTestingMode) {
        const currentQuestions = questions || [];
        const updatedQuestions = currentQuestions.map(q => 
          q.id === id ? { ...q, ...updates } : q
        );
        setQuestions(updatedQuestions);
        saveTestQuestions(updatedQuestions);
        
        toast.success('Custom question updated successfully (Testing Mode)');
        
        return true;
      }

      try {
        const { error } = await supabase
          .from('custom_questions')
          .update(updates)
          .eq('id', id)
          .eq('creator_id', user.id);
        
        if (error) {
          throw error;
        }
        
        const currentQuestions = questions || [];
        setQuestions(
          currentQuestions.map(q => q.id === id ? { ...q, ...updates } : q)
        );
        
        toast.success('Custom question updated successfully');
        
        return true;
      } catch (dbError) {
        console.error('Database error updating question:', dbError);
        toast.error('Error connecting to the database. Please try again later.');
        return false;
      }
    } catch (error) {
      console.error('Error updating custom question:', error);
      toast.error('Failed to update custom question. Please try again.');
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
    hasError,
    createQuestion,
    updateQuestion,
    toggleArchiveQuestion,
    showArchived,
    toggleShowArchived,
    refreshQuestions: fetchQuestions
  };
}
