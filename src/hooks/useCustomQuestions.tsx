
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';
import { toast } from 'sonner';

// Storage key for test mode
const TEST_QUESTIONS_KEY = 'test_custom_questions';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();
  
  // Initialize localStorage for testing mode
  useEffect(() => {
    if (isTestingMode) {
      try {
        const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
        if (!storedData) {
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
        }
      } catch (error) {
        console.error('Error initializing localStorage:', error);
      }
    }
  }, [isTestingMode]);
  
  // Fetch questions from either Supabase or localStorage
  const fetchQuestions = useCallback(async () => {
    if (!user) {
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      
      // Check subscription access
      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      // Testing mode: get questions from localStorage
      if (isTestingMode) {
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          const storedQuestions: CustomQuestion[] = storedData ? JSON.parse(storedData) : [];
          
          const filteredQuestions = showArchived 
            ? storedQuestions 
            : storedQuestions.filter(q => !q.archived);
          
          setQuestions(filteredQuestions);
        } catch (error) {
          console.error('Error parsing stored questions:', error);
          setQuestions([]);
          setHasError(true);
        }
        
        setIsLoading(false);
        return;
      }

      // Production mode: get questions from Supabase
      let query = supabase
        .from('custom_questions')
        .select('*')
        .eq('creator_id', user.id);
      
      if (!showArchived) {
        query = query.eq('archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setHasError(true);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [user, showArchived, hasAccess, isTestingMode]);

  // Toggle archive filter
  const toggleShowArchived = useCallback(() => {
    setShowArchived(prev => !prev);
  }, []);

  // Create a new question
  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        toast.error('Custom questions are only available in the Foundation plan and above');
        return null;
      }

      // Testing mode: add to localStorage
      if (isTestingMode) {
        const newQuestion: CustomQuestion = {
          id: Date.now().toString(),
          ...question,
          creator_id: user.id,
          archived: false,
          created_at: new Date().toISOString()
        };
        
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          const currentQuestions = storedData ? JSON.parse(storedData) : [];
          const updatedQuestions = [newQuestion, ...currentQuestions];
          
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
          
          // Update state only after local storage has been updated
          if (!newQuestion.archived || showArchived) {
            setQuestions(prev => [newQuestion, ...prev]);
          }
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
          throw storageError;
        }
        
        toast.success('Custom question created successfully');
        return newQuestion;
      }

      // Production mode: add to Supabase
      const { data, error } = await supabase
        .from('custom_questions')
        .insert({
          ...question,
          creator_id: user.id,
          archived: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Only update state if the question should be visible
      if (showArchived || !data.archived) {
        setQuestions(prev => [data, ...prev]);
      }
      
      toast.success('Custom question created successfully');
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create custom question');
      return null;
    }
  };

  // Update an existing question
  const updateQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!user) return false;
    
    try {
      // Testing mode: update in localStorage
      if (isTestingMode) {
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          const currentQuestions = storedData ? JSON.parse(storedData) : [];
          
          const updatedQuestions = currentQuestions.map((q: CustomQuestion) => 
            q.id === id ? { ...q, ...updates } : q
          );
          
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
          
          // Update state
          setQuestions(prev => 
            prev.map(q => q.id === id ? { ...q, ...updates } : q)
          );
          
          toast.success('Custom question updated successfully');
          return true;
        } catch (storageError) {
          console.error('Error updating localStorage:', storageError);
          toast.error('Failed to update question in testing mode');
          return false;
        }
      }

      // Production mode: update in Supabase
      const { error } = await supabase
        .from('custom_questions')
        .update(updates)
        .eq('id', id)
        .eq('creator_id', user.id);
      
      if (error) throw error;
      
      // Update state
      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, ...updates } : q)
      );
      
      toast.success('Custom question updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update custom question');
      return false;
    }
  };

  // Toggle archive status
  const toggleArchiveQuestion = async (id: string, currentArchived: boolean) => {
    return updateQuestion(id, { archived: !currentArchived });
  };

  // Fetch questions when component mounts or dependencies change
  useEffect(() => {
    fetchQuestions();
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
