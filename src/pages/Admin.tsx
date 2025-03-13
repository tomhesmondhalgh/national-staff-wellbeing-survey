
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import PageTitle from '../components/ui/PageTitle';
import PurchasesManagement from '../components/admin/PurchasesManagement';
import { PlansManagement } from '../components/admin/PlansManagement';
import { useAdminRole } from '../hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

function Admin() {
  const [activeTab, setActiveTab] = useState('purchases');
  const { isAdmin, isLoading } = useAdminRole();

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
      <div className="container py-6 space-y-6 max-w-7xl">
        <PageTitle title="Admin Dashboard" />

        <Tabs defaultValue="purchases" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:max-w-md">
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <div className="mt-6">
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
          </div>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

export default Admin;
