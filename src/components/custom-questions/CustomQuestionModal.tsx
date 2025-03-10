
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { CustomQuestion } from '../../types/customQuestions';
import QuestionTypeSelector from './modal/QuestionTypeSelector';
import QuestionTextInput from './modal/QuestionTextInput';
import MultipleChoiceOptions from './modal/MultipleChoiceOptions';
import ModalFooter from './modal/ModalFooter';
import { useQuestionForm, MAX_TEXT_LENGTH, MAX_OPTIONS } from './modal/useQuestionForm';

interface CustomQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: Omit<CustomQuestion, 'id' | 'created_at' | 'archived'>) => Promise<any>;
  initialData?: CustomQuestion;
  isEdit?: boolean;
}

const CustomQuestionModal: React.FC<CustomQuestionModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEdit = false
}) => {
  const {
    questionText,
    setQuestionText,
    questionType,
    setQuestionType,
    options,
    updateOption,
    addOption,
    removeOption,
    isSubmitting,
    errors,
    handleSubmit
  } = useQuestionForm(open, initialData, onSave);
  
  const onSubmit = async () => {
    const result = await handleSubmit();
    if (result) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Question' : 'Create Custom Question'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update your custom question details below.' 
              : 'Add a new custom question to include in your surveys.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Question Type Selection */}
          <QuestionTypeSelector 
            questionType={questionType}
            setQuestionType={setQuestionType}
          />
          
          {/* Question Text */}
          <QuestionTextInput
            questionText={questionText}
            setQuestionText={setQuestionText}
            maxLength={MAX_TEXT_LENGTH}
            error={errors.questionText}
          />
          
          {/* Multiple Choice Options */}
          {questionType === 'multiple-choice' && (
            <MultipleChoiceOptions
              options={options}
              updateOption={updateOption}
              addOption={addOption}
              removeOption={removeOption}
              maxOptions={MAX_OPTIONS}
              errors={errors}
            />
          )}
        </div>
        
        <DialogFooter>
          <ModalFooter
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomQuestionModal;
