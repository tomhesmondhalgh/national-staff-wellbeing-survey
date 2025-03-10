
import React from 'react';
import { Label } from '../../ui/label';

interface QuestionTypeSelectorProps {
  questionType: 'text' | 'multiple-choice';
  setQuestionType: (type: 'text' | 'multiple-choice') => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  questionType,
  setQuestionType
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="question-type">Question Type</Label>
      <div className="flex space-x-4">
        <div className="flex items-center">
          <input
            type="radio"
            id="text-type"
            name="question-type"
            value="text"
            checked={questionType === 'text'}
            onChange={() => setQuestionType('text')}
            className="mr-2"
          />
          <Label htmlFor="text-type" className="cursor-pointer">Free Text</Label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id="multiple-choice"
            name="question-type"
            value="multiple-choice"
            checked={questionType === 'multiple-choice'}
            onChange={() => setQuestionType('multiple-choice')}
            className="mr-2"
          />
          <Label htmlFor="multiple-choice" className="cursor-pointer">Multiple Choice</Label>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;
