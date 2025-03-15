
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import PageTitle from '../components/ui/PageTitle';
import PurchasesManagement from '../components/admin/PurchasesManagement';
import { PlansManagement } from '../components/admin/PlansManagement';
import { TestingMode } from '../components/admin/TestingMode';
import { XeroIntegration } from '../components/admin/XeroIntegration';
import { useAdminRole } from '../hooks/useAdminRole';
import { Navigate, useSearchParams } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import { toast } from 'sonner';

function Admin() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('testing');
  const { isAdmin, isLoading } = useAdminRole();

  useEffect(() => {
    // Handle Xero OAuth response parameters
    const xeroError = searchParams.get('xerror');
    const xeroConnected = searchParams.get('xero');
    const errorDetail = searchParams.get('error_detail');

    if (xeroError) {
      const errorMessage = errorDetail 
        ? `${xeroError.replace(/_/g, ' ')}: ${errorDetail}`
        : xeroError.replace(/_/g, ' ');
      
      console.error('Xero connection error:', errorMessage);
      toast.error(`Xero connection failed: ${errorMessage}`);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setActiveTab('integrations');
    } else if (xeroConnected === 'connected') {
      toast.success('Successfully connected to Xero');
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setActiveTab('integrations');
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container py-6 space-y-6 max-w-7xl">
          <PageTitle 
            title="Admin Dashboard" 
            subtitle="Manage your application and users"
          />

          <Tabs defaultValue="testing" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 md:max-w-3xl">
              <TabsTrigger value="testing">Testing Mode</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="testing" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <TestingMode />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="purchases" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <PurchasesManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plans" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <PlansManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <XeroIntegration />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default Admin;
