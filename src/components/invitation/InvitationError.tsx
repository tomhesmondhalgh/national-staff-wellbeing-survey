
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface InvitationErrorProps {
  errorMessage: string;
}

const InvitationError: React.FC<InvitationErrorProps> = ({ errorMessage }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <Button onClick={() => navigate('/')} className="w-full">
          Return to Homepage
        </Button>
      </div>
    </div>
  );
};

export default InvitationError;
