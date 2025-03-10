
import { useEffect, useState } from 'react';
import { useQuestionStore } from './useQuestionStore';
import { CustomQuestion } from '../types/customQuestions';

export function useCustomQuestions() {
  const { questions, isLoading, fetchQuestions, createQuestion, updateQuestion } = useQuestionStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch questions when the component mounts or when refresh is triggered
  useEffect(() => {
    fetchQuestions(false); // Default to fetching non-archived questions
  }, [refreshTrigger]);

  // Function to manually trigger a refresh
  const refreshQuestions = async () => {
    await fetchQuestions(false);
    setRefreshTrigger(prev => prev + 1);
    return true;
  };

  return {
    questions,
    isLoading,
    refreshQuestions,
    createQuestion,
    updateQuestion
  };
}
