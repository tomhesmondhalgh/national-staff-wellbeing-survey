
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MembersAndInvitationsList from '../components/team/MembersAndInvitationsList';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationsList from '../components/team/OrganizationsList';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTestingMode } from '../contexts/TestingModeContext';

const Team = () => {
  const { userRole } = usePermissions();
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Determine if the user can see the Organizations tab
  // Only group_admin and administrator roles can see the Organizations tab
  const canSeeOrganizationsTab = 
    userRole === 'group_admin' || 
    userRole === 'administrator' ||
    (isTestingMode && (testingRole === 'group_admin' || testingRole === 'administrator'));

  useEffect(() => {
    // Simplified role check
    const checkAdmin = () => {
      if (userRole === 'administrator' || 
          userRole === 'group_admin' || 
          userRole === 'organization_admin' ||
          (isTestingMode && ['administrator', 'group_admin', 'organization_admin'].includes(testingRole || ''))) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [userRole, isTestingMode, testingRole]);

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
              {isTestingMode && (
                <p className="mt-2 text-sm">Current testing role: {testingRole || 'none'}</p>
              )}
            </AlertDescription>
          </Alert>
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
