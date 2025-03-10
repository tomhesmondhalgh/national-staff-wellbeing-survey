
import { useState, useEffect } from 'react';
import { CustomQuestion } from '../types/customQuestions';
import { toast } from 'sonner';

// Storage key for test mode
const TEST_QUESTIONS_KEY = 'test_custom_questions';

export function useTestingQuestions(showArchived: boolean, userId: string | undefined) {
  const [testingQuestions, setTestingQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Initialize localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
      if (!storedData) {
        localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error initializing localStorage:', error);
    }
  }, []);

  // Fetch questions from localStorage
  const fetchTestingQuestions = async () => {
    if (!userId) {
      setTestingQuestions([]);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
        const storedQuestions: CustomQuestion[] = storedData ? JSON.parse(storedData) : [];
        
        const filteredQuestions = showArchived 
          ? storedQuestions 
          : storedQuestions.filter(q => !q.archived);
        
        setTestingQuestions(filteredQuestions);
        setIsLoading(false);
        return filteredQuestions;
      } catch (error) {
        console.error('Error parsing stored questions:', error);
        setTestingQuestions([]);
        setHasError(true);
        setIsLoading(false);
        return [];
      }
    } catch (error) {
      console.error('Error fetching testing questions:', error);
      setHasError(true);
      setIsLoading(false);
      return [];
    }
  };

  // Create a new question in localStorage
  const createTestingQuestion = async (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => {
    if (!userId) return null;
    
    try {
      const newQuestion: CustomQuestion = {
        id: Date.now().toString(),
        ...question,
        creator_id: userId,
        archived: false,
        created_at: new Date().toISOString()
      };
      
      try {
        const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
        const currentQuestions = storedData ? JSON.parse(storedData) : [];
        const updatedQuestions = [newQuestion, ...currentQuestions];
        
        localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
        
        // Only update state if the question should be visible
        if (!newQuestion.archived || showArchived) {
          setTestingQuestions(prev => [newQuestion, ...prev]);
        }

        toast.success('Custom question created successfully');
        return newQuestion;
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        toast.error('Failed to save question to local storage');
        return null;
      }
    } catch (error) {
      console.error('Error creating testing question:', error);
      toast.error('Failed to create custom question');
      return null;
    }
  };

  // Update an existing question in localStorage
  const updateTestingQuestion = async (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>) => {
    if (!userId) return false;
    
    try {
      const storedData = localStorage.getItem(TEST_QUESTIONS_KEY);
      const currentQuestions = storedData ? JSON.parse(storedData) : [];
      
      const updatedQuestions = currentQuestions.map((q: CustomQuestion) => 
        q.id === id ? { ...q, ...updates } : q
      );
      
      localStorage.setItem(TEST_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
      
      // Update state
      setTestingQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, ...updates } : q)
      );
      
      toast.success('Custom question updated successfully');
      return true;
    } catch (storageError) {
      console.error('Error updating localStorage:', storageError);
      toast.error('Failed to update question in testing mode');
      return false;
    }
  };

  return {
    testingQuestions,
    isLoading,
    hasError,
    fetchTestingQuestions,
    createTestingQuestion,
    updateTestingQuestion
  };
}
