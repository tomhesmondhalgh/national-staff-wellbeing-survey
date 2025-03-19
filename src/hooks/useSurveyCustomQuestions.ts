
import { useState, useEffect } from 'react';
import { useCustomQuestions } from '../contexts/CustomQuestionsContext';
import { CustomQuestionType } from '../types/surveyForm';

export function useSurveyCustomQuestions(surveyId: string | null) {
  const { questions, isLoading, error, loadQuestions } = useCustomQuestions();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchCustomQuestions = async () => {
      if (surveyId) {
        try {
          await loadQuestions(surveyId);
        } catch (err) {
          console.error('Error loading custom questions:', err);
        } finally {
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
    };

    fetchCustomQuestions();
  }, [surveyId, loadQuestions]);

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const hasQuestions = questions.length > 0;

  return {
    questions,
    responses,
    hasQuestions,
    isLoading: isLoading && !isInitialized,
    error,
    handleResponse
  };
}
