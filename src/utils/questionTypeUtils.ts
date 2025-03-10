
import { CustomQuestion } from '../types/customQuestions';

// Type validation constants
export const VALID_QUESTION_TYPES = ['text'] as const;
export type QuestionType = typeof VALID_QUESTION_TYPES[number];

/**
 * Validates if a question type string is a valid QuestionType
 */
export function isValidQuestionType(type: string): type is QuestionType {
  return VALID_QUESTION_TYPES.includes(type as QuestionType);
}

/**
 * Safely converts any string to a valid QuestionType
 */
export function toValidQuestionType(type: string): QuestionType {
  return 'text';
}

/**
 * Creates a properly formatted question object for database operations
 */
export function createDbQuestionPayload(
  question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>
): Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'> {
  return {
    text: question.text,
    type: 'text'
  };
}
