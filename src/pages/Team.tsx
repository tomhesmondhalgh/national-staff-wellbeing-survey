
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MembersAndInvitationsList from '../components/team/MembersAndInvitationsList';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationsList from '../components/team/OrganizationsList';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, Info, User, RefreshCw, ArrowRight } from 'lucide-react';
import { useTestingMode } from '../contexts/TestingModeContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';

const Team = () => {
  const { userRole, error: permissionsError, isLoading: permissionsLoading } = usePermissions();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { isTestingMode, testingRole, testingPlan, setTestingRole } = useTestingMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { isLoading: isSubscriptionLoading, isPremium, isProgress } = useSubscription();
  const [hasProgressPlan, setHasProgressPlan] = useState<boolean | null>(null);
  
  // Check if user has Progress plan based on subscription or testing mode
  useEffect(() => {
    const checkProgressPlan = () => {
      if (isTestingMode) {
        console.log('Testing mode plan check: current plan =', testingPlan);
        // In testing mode, check the testingPlan
        const hasProgress = testingPlan === 'progress' || testingPlan === 'premium';
        console.log('Has progress plan in testing mode:', hasProgress);
        setHasProgressPlan(hasProgress);
      } else {
        // Normal subscription check
        console.log('Normal subscription check:', isProgress, isPremium);
        setHasProgressPlan(isProgress || isPremium);
      }
    };
    
    if (!isSubscriptionLoading) {
      checkProgressPlan();
    }
  }, [isSubscriptionLoading, isProgress, isPremium, isTestingMode, testingPlan]);
  
  // Determine if the user can see the Organisations tab
  // Only group_admin and administrator roles can see the Organisations tab
  const canSeeOrganizationsTab = 
    userRole === 'group_admin' || 
    userRole === 'administrator' ||
    (isTestingMode && (testingRole === 'group_admin' || testingRole === 'administrator'));

  // Helper function to enable admin testing mode
  const enableAdminTestMode = () => {
    setTestingRole('organization_admin');
    toast.success('Admin testing mode enabled. You now have organisation_admin permissions.');
  };
  
  // Helper function to force reload the page
  const refreshPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    // For debugging purposes
    console.log('Team page - Current user role:', userRole);
    console.log('Current organisation:', currentOrganization?.name);
    console.log('Testing mode active:', isTestingMode, 'Testing plan:', testingPlan);
    
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
  }, [userRole, isTestingMode, testingRole, testingPlan, currentOrganization]);

  // If permissions are still loading, show a loading indicator
  if (permissionsLoading || isSubscriptionLoading || hasProgressPlan === null) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organisation"
            className="mb-8"
          />
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if user has Progress plan
  if (!hasProgressPlan) {
    console.log('User does not have Progress plan, showing upgrade message');
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organisation"
            className="mb-8"
          />
          
          <Card className="bg-white border border-gray-200 rounded-lg">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Upgrade to Access Team Management</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Team Management is available with Progress and Premium plans. 
                Upgrade today to add additional users and collaborate on your wellbeing action plan.
              </p>
              
              <Button onClick={() => navigate('/upgrade')} size="lg" className="bg-brandPurple-500 hover:bg-brandPurple-600">
                View Upgrade Options <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Handle the case of personal organisations differently
  // If user ID matches organisation ID, they are automatically an admin of their own profile/organisation
  const isPersonalOrg = currentOrganization?.id === user?.id;
  if (isPersonalOrg && !isAdmin) {
    console.log('User is accessing their personal organisation, granting implicit admin access');
    setIsAdmin(true);
  }

  // If user doesn't have admin permissions, show a message
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organisation"
            className="mb-8"
          />
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <p>You need administrator permissions to access this page.</p>
              <p className="mt-2 text-sm">Current role: {userRole || 'none'}</p>
              <p className="mt-2 text-sm">Current organisation: {currentOrganization?.name || 'none'}</p>
              {isTestingMode && (
                <p className="mt-2 text-sm">Current testing role: {testingRole || 'none'}</p>
              )}
              {permissionsError && (
                <p className="mt-2 text-sm text-red-500">Error: {permissionsError}</p>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
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
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start mb-2">
                <User size={18} className="text-gray-500 mr-2 mt-0.5" />
                <h3 className="font-medium">Organisation Owner?</h3>
              </div>
              <p className="text-sm mb-3">
                If you are the organisation owner, try refreshing the page or contact support if the issue persists.
              </p>
              <Button 
                onClick={refreshPage}
                variant="outline" 
                className="flex items-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if an organisation is selected
  if (!currentOrganization) {
    return (
      <MainLayout>
        <div className="page-container">
          <PageTitle 
            title="Team Management" 
            subtitle="Manage members and permissions for your organisation"
            className="mb-8"
          />
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Please select an organisation to manage team members.
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
          subtitle="Manage members and permissions for your organisation"
          className="mb-8"
        />
        
        {isTestingMode && (
          <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
            <AlertDescription>
              <p>Testing Mode is enabled with role: <strong>{testingRole || 'none'}</strong> and plan: <strong>{testingPlan || 'none'}</strong></p>
              <p className="text-sm mt-1">This is simulating permissions for that role level and subscription plan.</p>
            </AlertDescription>
          </Alert>
        )}
        
        {isPersonalOrg && (
          <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
            <Info className="h-4 w-4 mr-2 text-green-500" />
            <AlertTitle>Personal Organisation</AlertTitle>
            <AlertDescription>
              This is your personal organisation. You are automatically the admin.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg shadow-sm">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none px-6">
              <TabsTrigger value="members">Members</TabsTrigger>
              {canSeeOrganizationsTab && <TabsTrigger value="organizations">Organisations</TabsTrigger>}
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
