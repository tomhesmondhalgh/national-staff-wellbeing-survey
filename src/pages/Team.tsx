
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MembersAndInvitationsList from '../components/team/MembersAndInvitationsList';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationsList from '../components/team/OrganizationsList';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTestingMode } from '../contexts/TestingModeContext';

const Team = () => {
  const { canManageTeam, isLoading, canManageGroups, userRole } = usePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const { currentOrganization } = useOrganization();
  const { isTestingMode, testingRole } = useTestingMode();
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (isTestingMode && ['administrator', 'group_admin', 'organization_admin'].includes(testingRole || '')) {
          setHasPermission(true);
          setPermissionChecked(true);
          return;
        }
        
        const result = await canManageTeam();
        setHasPermission(result);
      } catch (error) {
        console.error('Error checking team management permission:', error);
        setHasPermission(false);
      } finally {
        setPermissionChecked(true);
      }
    };

    if (!isLoading) {
      checkPermission();
    }
  }, [isLoading, canManageTeam, isTestingMode, testingRole]);

  // Show loading state while checking permissions
  if (isLoading || !permissionChecked) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Redirect if user doesn't have permission
  if (permissionChecked && !hasPermission) {
    if (isTestingMode) {
      return (
        <MainLayout>
          <div className="page-container">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                <p>In Testing Mode, you need an admin role to view this page.</p>
                <p className="mt-2 text-sm">Current testing role: {testingRole || 'none'}</p>
              </AlertDescription>
            </Alert>
          </div>
        </MainLayout>
      );
    }
    return <Navigate to="/dashboard" replace />;
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

  // Determine if the user can see the Organizations tab
  // Only group_admin and administrator roles can see the Organizations tab
  const canSeeOrganizationsTab = 
    (userRole === 'group_admin' || userRole === 'administrator') ||
    (isTestingMode && (testingRole === 'group_admin' || testingRole === 'administrator'));

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
