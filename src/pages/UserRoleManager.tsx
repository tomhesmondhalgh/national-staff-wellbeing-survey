
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { 
  ensureAllUsersHaveProfiles, 
  ensureCurrentUserHasProfile
} from '../utils/auth/ensureUserRoles';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, UserCheck, AlertTriangle } from 'lucide-react';

export default function UserRoleManager() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleEnsureAllUsers = async () => {
    setIsLoading(true);
    setErrorDetails(null);
    try {
      const result = await ensureAllUsersHaveProfiles();
      setResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        const errorMsg = `Error updating user profiles: ${result.error?.message || 'Unknown error'}`;
        setErrorDetails(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMsg = `An error occurred: ${error?.message || 'Unknown error'}`;
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnsureCurrentUser = async () => {
    setIsLoading(true);
    setErrorDetails(null);
    try {
      console.log('Starting profile check for current user');
      const result = await ensureCurrentUserHasProfile();
      console.log('Profile check result:', result);
      
      if (result.success) {
        toast.success('Successfully verified your profile information');
      } else {
        const errorMessage = result.error ? 
          (typeof result.error === 'string' ? result.error : result.error.message || 'Unknown error') : 
          'Unknown error';
          
        const detailedError = `Error checking your profile: ${errorMessage}`;
        
        console.error(detailedError, result.error);
        setErrorDetails(detailedError);
        toast.error(`Error checking your profile: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Exception:', error);
      const errorMsg = `An unexpected error occurred: ${error?.message || 'Unknown error'}`;
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Current User</CardTitle>
            <CardDescription>
              Ensure your account has a profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will check your current account and ensure you have a profile.</p>
            
            {errorDetails && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-medium flex items-center text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Error Details
                </h3>
                <p className="mt-1 text-sm text-red-600">{errorDetails}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleEnsureCurrentUser} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Verify My Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Update All Users</CardTitle>
            <CardDescription>
              Ensure all users have profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will check all users in the system and ensure they have profiles.</p>
            
            {result && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium flex items-center">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  Results
                </h3>
                
                {result.success && result.stats && (
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>Total users processed: {result.stats.total}</li>
                    <li>Profiles created: {result.stats.profilesCreated}</li>
                    {result.stats.errors > 0 && (
                      <li className="text-red-500">Errors: {result.stats.errors}</li>
                    )}
                  </ul>
                )}
                
                {!result.success && (
                  <p className="text-red-500 mt-2 text-sm">
                    Error: {result.error?.message || 'Unknown error'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleEnsureAllUsers} 
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing All Users...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Verify All Users
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
