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
  
  const fetchQuestions = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastFetchTime < 1000) {
        return;
      }
      
      setLastFetchTime(now);
      setIsLoading(true);
      setHasError(false);
      
      if (!user) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      if (isTestingMode) {
        try {
          const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
          let storedQuestions: CustomQuestion[] = storedData ? JSON.parse(storedData) : [];
          
          const filteredQuestions = showArchived 
            ? storedQuestions 
            : storedQuestions.filter(q => !q.archived);
          
          setQuestions(filteredQuestions);
        } catch (error) {
          console.error('Error parsing stored questions:', error);
          setQuestions([]);
          setHasError(true);
        }
      } else {
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
    if (!user) return null;
    
    try {
      const hasFeatureAccess = await hasAccess('foundation');
      
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
        
        try {
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
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
      
      if (error) throw error;
      
      const currentQuestions = questions || [];
      setQuestions([data, ...currentQuestions]);
      
      toast.success('Custom question created successfully');
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create custom question');
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
        
        try {
          localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
        
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

  useEffect(() => {
    fetchQuestions().catch(error => {
      console.error('Error in fetchQuestions effect:', error);
      setIsLoading(false);
      setHasError(true);
      setQuestions([]);
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
