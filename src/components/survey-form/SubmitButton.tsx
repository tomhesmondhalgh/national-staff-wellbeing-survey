
import React from 'react';
import { cn } from '../../lib/utils';

interface SubmitButtonProps {
  isSubmitting: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isSubmitting }) => {
  return (
    <div className="mt-10 flex justify-center">
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "btn-primary min-w-[200px] py-3",
          isSubmitting && "opacity-70 cursor-not-allowed"
        )}
      >
        {isSubmitting ? "Submitting..." : "Submit Survey"}
      </button>
    </div>
  );
};

export default SubmitButton;
