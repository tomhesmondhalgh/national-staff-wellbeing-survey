import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { 
  ensureAllUsersHaveOrgAdminRole, 
  ensureCurrentUserHasOrgAdminRole,
  EnsureUserRoleResult
} from '../utils/auth/ensureUserRoles';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, UserCheck } from 'lucide-react';

export default function UserRoleManager() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleEnsureAllUsers = async () => {
    setIsLoading(true);
    try {
      const result = await ensureAllUsersHaveOrgAdminRole();
      setResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Error updating user roles');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while updating user roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnsureCurrentUser = async () => {
    setIsLoading(true);
    try {
      const result = await ensureCurrentUserHasOrgAdminRole();
      
      if (result.success) {
        if ('noUser' in result) {
          toast.info('No logged in user to check');
        } else if ('roleAdded' in result) {
          if (result.roleAdded || result.membershipAdded) {
            toast.success('Successfully updated your role to Organization Admin');
          } else {
            toast.info('Your account already has the Organization Admin role');
          }
        } 
      } else {
        toast.error('Error updating your role');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while updating your role');
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
              Ensure your account has the Organization Admin role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will check your current account and ensure you have the Organization Admin role.</p>
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
                  Update My Role
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Update All Users</CardTitle>
            <CardDescription>
              Ensure all users have the Organization Admin role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This will check all users in the system and ensure they have the Organization Admin role.</p>
            
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
                    <li>Roles added: {result.stats.rolesAdded}</li>
                    <li>Memberships added: {result.stats.membershipsAdded}</li>
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
                  Update All Users
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
