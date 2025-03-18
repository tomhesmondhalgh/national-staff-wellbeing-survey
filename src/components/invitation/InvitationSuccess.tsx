
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface InvitationSuccessProps {
  organizationName: string;
}

const InvitationSuccess: React.FC<InvitationSuccessProps> = ({ organizationName }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-brandPurple-600 mb-4">Success!</h1>
        <p className="text-gray-700 mb-6">
          You have successfully joined <span className="font-semibold">{organizationName}</span>.
          Redirecting you to the dashboard...
        </p>
      </div>
    </div>
  );
};

export default InvitationSuccess;
