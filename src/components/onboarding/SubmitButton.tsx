
import React from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isLoading }) => {
  return (
    <Button 
      type="submit" 
      className="btn-primary w-full mt-4 flex justify-center items-center" 
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="mr-2 animate-spin" />
          Completing profile...
        </>
      ) : (
        <>Continue to profile</>
      )}
    </Button>
  );
};

export default SubmitButton;
