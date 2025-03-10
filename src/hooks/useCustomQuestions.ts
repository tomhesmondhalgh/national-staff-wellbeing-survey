
import { useEffect, useState } from 'react';
import { useQuestionStore } from './useQuestionStore';

export function useCustomQuestions() {
  const { questions, isLoading, fetchQuestions, createQuestion, updateQuestion } = useQuestionStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadQuestions = async () => {
      await fetchQuestions(false);
    };
    loadQuestions();
  }, [refreshTrigger]);

  const refreshQuestions = async () => {
    const questions = await fetchQuestions(false);
    if (questions.length >= 0) { // Check if fetch was successful
      setRefreshTrigger(prev => prev + 1);
      return true;
    }
    return false;
  };

  return {
    questions,
    isLoading,
    refreshQuestions,
    createQuestion,
    updateQuestion
  };
}
