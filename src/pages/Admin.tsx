
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { PageTitle } from '../components/ui/PageTitle';
import { PurchasesManagement } from '../components/admin/PurchasesManagement';
import { PlansManagement } from '../components/admin/PlansManagement';

function Admin() {
  const [activeTab, setActiveTab] = useState('purchases');

  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      <PageTitle>Admin Dashboard</PageTitle>

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
  );
}

export default Admin;
