
import React from 'react';
import { Button } from '../../ui/button';

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  onCancel,
  onSubmit,
  isSubmitting,
  isEdit
}) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button 
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting 
          ? 'Saving...' 
          : (isEdit ? 'Update Question' : 'Create Question')}
      </Button>
    </div>
  );
};

export default ModalFooter;
