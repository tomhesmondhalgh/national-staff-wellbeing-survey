
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MemberList from '../components/team/MemberList';
import InvitationsList from '../components/team/InvitationsList';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationsList from '../components/team/OrganizationsList';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Team = () => {
  const { canManageTeam, isLoading, canManageGroups } = usePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
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
  }, [isLoading, canManageTeam]);

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

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Team Management" 
          subtitle="Manage members and permissions for your organization"
          className="mb-8"
        />
        
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-6">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              {canManageGroups && <TabsTrigger value="organizations">Organizations</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="members" className="p-6">
              <MemberList />
            </TabsContent>
            
            <TabsContent value="invitations" className="p-6">
              <InvitationsList />
            </TabsContent>
            
            {canManageGroups && (
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
