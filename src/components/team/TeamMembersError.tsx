
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

type TeamMembersErrorProps = {
  error: Error | null;
  userRole?: string | null;
  organizationName?: string | null;
  refetchAll: () => void;
};

export default function TeamMembersError({ 
  error, 
  userRole, 
  organizationName, 
  refetchAll 
}: TeamMembersErrorProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Failed to load team members and invitations. Please try again later.
          {error instanceof Error && <p className="text-sm mt-2">{error.message}</p>}
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center">
        <Button 
          onClick={refetchAll} 
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </Button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>Ensure you have the correct permissions for this organization.</li>
          <li>Your current role: <strong>{userRole || 'None'}</strong></li>
          <li>Current organization: <strong>{organizationName || 'None'}</strong></li>
          <li>If you're the organization owner, this might be a database configuration issue.</li>
        </ul>
      </div>
    </div>
  );
}
