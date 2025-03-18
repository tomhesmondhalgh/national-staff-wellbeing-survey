
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Briefcase } from 'lucide-react';

interface InvitationDetailsProps {
  organizationName: string;
  role: string;
  onAccept: () => void;
  isLoading: boolean;
}

const InvitationDetails: React.FC<InvitationDetailsProps> = ({
  organizationName,
  role,
  onAccept,
  isLoading
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-brandPurple-100 p-4 rounded-full">
            <Briefcase className="h-16 w-16 text-brandPurple-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-brandPurple-600 mb-4">Organisation Invitation</h1>
        <p className="text-gray-700 mb-6">
          You've been invited to join <span className="font-semibold">{organizationName}</span> as a <span className="font-semibold">{role.replace('_', ' ')}</span>.
        </p>
        
        <Button 
          onClick={onAccept}
          disabled={isLoading}
          className="w-full bg-brandPurple-500 hover:bg-brandPurple-600 mb-4"
        >
          {isLoading ? "Processing..." : "Accept Invitation"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="w-full"
        >
          Decline
        </Button>
      </div>
    </div>
  );
};

export default InvitationDetails;
