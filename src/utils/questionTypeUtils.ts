
import { CustomQuestion } from '../types/customQuestions';

// Type validation constants
export const VALID_QUESTION_TYPES = ['text', 'multiple_choice'] as const;
export type QuestionType = typeof VALID_QUESTION_TYPES[number];

/**
 * Validates if a question type string is a valid QuestionType
 * @param type The string to validate
 * @returns True if the type is valid, false otherwise
 */
export function isValidQuestionType(type: string): type is QuestionType {
  return VALID_QUESTION_TYPES.includes(type as QuestionType);
}

/**
 * Safely converts any string to a valid QuestionType
 * @param type The string to convert
 * @returns A valid QuestionType ('text' as fallback)
 */
export function toValidQuestionType(type: string): QuestionType {
  return isValidQuestionType(type) ? type : 'text';
}

/**
 * Creates a properly formatted question object for database operations
 * @param question Frontend question data
 * @returns Database-compatible question object
 */
export function createDbQuestionPayload(
  question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'>
): Omit<CustomQuestion, 'id' | 'created_at' | 'archived' | 'creator_id'> {
  // Ensure question type is valid
  const validType = toValidQuestionType(question.type);
  
  // Return sanitized payload
  return {
    text: question.text,
    type: validType,
    options: validType === 'multiple_choice' ? question.options : undefined
  };
}
