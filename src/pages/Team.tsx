
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MembersAndInvitationsList from '../components/team/MembersAndInvitationsList';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationsList from '../components/team/OrganizationsList';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTestingMode } from '../contexts/TestingModeContext';
import { Button } from '../components/ui/button';

const Team = () => {
  const { userRole, error } = usePermissions();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole, setTestingRole } = useTestingMode();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Determine if the user can see the Organizations tab
  // Only group_admin and administrator roles can see the Organizations tab
  const canSeeOrganizationsTab = 
    userRole === 'group_admin' || 
    userRole === 'administrator' ||
    (isTestingMode && (testingRole === 'group_admin' || testingRole === 'administrator'));

  // Helper function to enable admin testing mode
  const enableAdminTestMode = () => {
    setTestingRole('organization_admin');
  };

  useEffect(() => {
    // For debugging purposes
    console.log('Team page - Current user role:', userRole);
    console.log('Current organization:', currentOrganization?.name);
    
    // Simplified role check
    const checkAdmin = () => {
      if (userRole === 'administrator' || 
          userRole === 'group_admin' || 
          userRole === 'organization_admin' ||
          (isTestingMode && ['administrator', 'group_admin', 'organization_admin'].includes(testingRole || ''))) {
        console.log('User has admin access to team page');
        setIsAdmin(true);
      } else {
        console.log('User does NOT have admin access to team page, role:', userRole);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [userRole, isTestingMode, testingRole, currentOrganization]);

  // If user doesn't have admin permissions, show a message
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organization"
            className="mb-8"
          />
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <p>You need administrator permissions to access this page.</p>
              <p className="mt-2 text-sm">Current role: {userRole || 'none'}</p>
              <p className="mt-2 text-sm">Current organization: {currentOrganization?.name || 'none'}</p>
              {isTestingMode && (
                <p className="mt-2 text-sm">Current testing role: {testingRole || 'none'}</p>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-500">Error: {error}</p>
              )}
            </AlertDescription>
          </Alert>
          
          {!isTestingMode && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start mb-2">
                <Info size={18} className="text-blue-500 mr-2 mt-0.5" />
                <h3 className="font-medium">Testing Mode Available</h3>
              </div>
              <p className="text-sm mb-3">
                Use testing mode to simulate administrative permissions while development is ongoing.
              </p>
              <Button 
                onClick={enableAdminTestMode}
                variant="outline" 
                className="bg-white border-blue-300 hover:bg-blue-100 text-blue-700"
              >
                Enable Admin Testing Mode
              </Button>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Check if an organization is selected
  if (!currentOrganization) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organization"
            className="mb-8"
          />
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Please select an organization to manage team members.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Team Management" 
          subtitle="Manage members and permissions for your organization"
          className="mb-8"
        />
        
        {isTestingMode && (
          <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
            <AlertDescription>
              <p>Testing Mode is enabled with role: <strong>{testingRole || 'none'}</strong></p>
              <p className="text-sm mt-1">This is simulating permissions for that role level.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-6">
              <TabsTrigger value="members">Members</TabsTrigger>
              {canSeeOrganizationsTab && <TabsTrigger value="organizations">Organizations</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="members" className="p-6">
              <MembersAndInvitationsList />
            </TabsContent>
            
            {canSeeOrganizationsTab && (
              <TabsContent value="organizations" className="p-6">
                <OrganizationsList />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;
