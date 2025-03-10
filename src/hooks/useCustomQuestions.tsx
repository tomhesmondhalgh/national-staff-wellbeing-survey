
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';
import { toast } from 'sonner';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();
  
  const TEST_QUESTIONS_KEY = 'test_custom_questions';
  
  // Initialize test questions in localStorage
  useEffect(() => {
    if (isTestingMode) {
      try {
        console.log('Initializing test questions storage');
        const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
        if (!storedData) {
          console.log('No test questions found, creating empty array');
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
        } else {
          console.log('Found existing test questions:', JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error initializing localStorage:', error);
        toast.error('Failed to initialize test storage');
      }
    }
  }, [isTestingMode]);
  
  const fetchQuestions = useCallback(async () => {
    try {
      console.log('Fetching questions, testing mode:', isTestingMode);
      const now = Date.now();
      if (now - lastFetchTime < 1000) {
        console.log('Skipping fetch, too soon after last fetch');
        return;
      }
      
      setLastFetchTime(now);
      setIsLoading(true);
      setHasError(false);
      
      if (!user) {
        console.log('No user, returning empty questions array');
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const hasFeatureAccess = await hasAccess('foundation');
      console.log('User has access to feature:', hasFeatureAccess);
      
      if (!hasFeatureAccess && !isTestingMode) {
        console.log('User does not have access and not in testing mode');
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      if (isTestingMode) {
        try {
          console.log('In testing mode, retrieving questions from localStorage');
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          let storedQuestions: CustomQuestion[] = [];
          
          if (storedData) {
            storedQuestions = JSON.parse(storedData);
            console.log('Retrieved test questions:', storedQuestions);
          } else {
            console.log('No stored questions found, initializing empty array');
            localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
          }
          
          const filteredQuestions = showArchived 
            ? storedQuestions 
            : storedQuestions.filter(q => !q.archived);
          
          console.log('Filtered questions:', filteredQuestions);
          setQuestions(filteredQuestions);
        } catch (error) {
          console.error('Error parsing stored questions:', error);
          setQuestions([]);
          setHasError(true);
          toast.error('Failed to load test questions');
        }
      } else {
        console.log('In production mode, fetching from Supabase');
        let query = supabase
          .from('custom_questions')
          .select('*')
          .eq('creator_id', user.id);
        
        if (!showArchived) {
          query = query.eq('archived', false);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Questions from Supabase:', data);
        setQuestions(data || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setHasError(true);
      setQuestions([]);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, hasAccess, isTestingMode, lastFetchTime]);

  const toggleShowArchived = useCallback(() => {
    console.log('Toggling show archived from', showArchived, 'to', !showArchived);
    setShowArchived(prev => !prev);
  }, [showArchived]);

  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) {
      toast.error('You must be logged in to create a question');
      return null;
    }
    
    try {
      console.log('Creating question:', question);
      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        toast.error('Custom questions are only available in the Foundation plan and above');
        return null;
      }

      if (isTestingMode) {
        console.log('Creating question in testing mode');
        const newQuestion: CustomQuestion = {
          id: Date.now().toString(),
          ...question,
          creator_id: user.id,
          archived: false,
          created_at: new Date().toISOString()
        };
        
        let updatedQuestions: CustomQuestion[] = [];
        
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          const currentQuestions = storedData ? JSON.parse(storedData) : [];
          updatedQuestions = [newQuestion, ...currentQuestions];
          
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
          console.log('Saved updated questions to localStorage:', updatedQuestions);
          
          setQuestions(prev => showArchived ? updatedQuestions : updatedQuestions.filter(q => !q.archived));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
          toast.error('Failed to save question to local storage');
          return null;
        }
        
        toast.success('Custom question created successfully');
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
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Question created in Supabase:', data);
      setQuestions(prev => [data, ...prev]);
      
      toast.success('Custom question created successfully');
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create custom question');
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!user) {
      toast.error('You must be logged in to update a question');
      return false;
    }
    
    try {
      console.log('Updating question:', id, updates);
      
      if (isTestingMode) {
        console.log('Updating question in testing mode');
        let updatedQuestions: CustomQuestion[] = [];
        
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          if (!storedData) {
            throw new Error('No stored questions found');
          }
          
          const currentQuestions = JSON.parse(storedData);
          updatedQuestions = currentQuestions.map((q: CustomQuestion) => 
            q.id === id ? { ...q, ...updates } : q
          );
          
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
          console.log('Updated questions in localStorage:', updatedQuestions);
          
          setQuestions(prev => showArchived ? updatedQuestions : updatedQuestions.filter(q => !q.archived));
        } catch (storageError) {
          console.error('Error updating in localStorage:', storageError);
          toast.error('Failed to update question in local storage');
          return false;
        }
        
        toast.success('Custom question updated successfully');
        return true;
      }

      try {
        const { error } = await supabase
          .from('custom_questions')
          .update(updates)
          .eq('id', id)
          .eq('creator_id', user.id);
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Question updated in Supabase');
        setQuestions(prev =>
          prev.map(q => q.id === id ? { ...q, ...updates } : q)
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
    console.log('Toggling archive status for question:', id, 'currently archived:', currentArchived);
    return updateQuestion(id, { archived: !currentArchived });
  };

  useEffect(() => {
    console.log('Fetching questions on mount or when dependencies change');
    fetchQuestions().catch(error => {
      console.error('Error in fetchQuestions effect:', error);
      setIsLoading(false);
      setHasError(true);
      setQuestions([]);
      toast.error('Failed to load questions');
    });
  }, [user, showArchived, isTestingMode, fetchQuestions]);

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
