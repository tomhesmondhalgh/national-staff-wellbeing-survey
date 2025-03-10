
import React from 'react';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface QuestionTextInputProps {
  questionText: string;
  setQuestionText: (text: string) => void;
  maxLength: number;
  error?: string;
}

const QuestionTextInput: React.FC<QuestionTextInputProps> = ({
  questionText,
  setQuestionText,
  maxLength,
  error
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="question-text">
        Question Text {questionText.length}/{maxLength}
      </Label>
      <Textarea
        id="question-text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Enter your question"
        className={error ? "border-red-500" : ""}
        maxLength={maxLength}
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default QuestionTextInput;
