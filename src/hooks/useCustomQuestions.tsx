
import { useState, useEffect, useCallback } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { useTestingMode } from '../contexts/TestingModeContext';
import { useTestingQuestions } from './useTestingQuestions';
import { useSupabaseQuestions } from './useSupabaseQuestions';
import { toast } from 'sonner';

export function useCustomQuestions() {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const { isTestingMode } = useTestingMode();
  
  // Initialize the specific question hooks
  const {
    testingQuestions,
    isLoading: isTestingLoading,
    hasError: hasTestingError,
    fetchTestingQuestions,
    createTestingQuestion,
    updateTestingQuestion
  } = useTestingQuestions(showArchived, user?.id);

  const {
    questions: supabaseQuestions,
    isLoading: isSupabaseLoading,
    hasError: hasSupabaseError,
    fetchSupabaseQuestions,
    createSupabaseQuestion,
    updateSupabaseQuestion
  } = useSupabaseQuestions(showArchived, user?.id);

  // Compute loading and error states
  const isLoading = isTestingMode ? isTestingLoading : isSupabaseLoading;
  const hasError = isTestingMode ? hasTestingError : hasSupabaseError;

  // Toggle archive filter
  const toggleShowArchived = useCallback(() => {
    setShowArchived(prev => !prev);
  }, []);

  // Fetch questions based on mode
  const fetchQuestions = useCallback(async () => {
    if (!user) {
      setQuestions([]);
      return;
    }

    try {
      // Check subscription access
      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        setQuestions([]);
        return;
      }

      // Fetch from the appropriate source
      let fetchedQuestions: CustomQuestion[] = [];
      if (isTestingMode) {
        fetchedQuestions = await fetchTestingQuestions();
      } else {
        fetchedQuestions = await fetchSupabaseQuestions();
      }
      
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      toast.error('Failed to load questions');
    }
  }, [user, showArchived, hasAccess, isTestingMode, fetchTestingQuestions, fetchSupabaseQuestions]);

  // Create a new question
  const createQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!user) return null;
    
    try {
      const hasFeatureAccess = await hasAccess('foundation');
      
      if (!hasFeatureAccess && !isTestingMode) {
        toast.error('Custom questions are only available in the Foundation plan and above');
        return null;
      }

      if (isTestingMode) {
        return await createTestingQuestion(question);
      } else {
        return await createSupabaseQuestion(question);
      }
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
      if (isTestingMode) {
        return await updateTestingQuestion(id, updates);
      } else {
        return await updateSupabaseQuestion(id, updates);
      }
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

  // Update questions state when testing/supabase questions change
  useEffect(() => {
    if (isTestingMode) {
      setQuestions(testingQuestions);
    } else {
      setQuestions(supabaseQuestions);
    }
  }, [isTestingMode, testingQuestions, supabaseQuestions]);

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
