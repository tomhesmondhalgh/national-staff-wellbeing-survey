
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '@/components/ui/PageTitle';
import XeroConnector from '@/components/integrations/XeroConnector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const XeroIntegration = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <PageTitle title="Xero Integration" />
        <p className="text-muted-foreground mb-8">
          Connect your Xero account to integrate with your accounting system.
        </p>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>About Xero Integration</CardTitle>
              <CardDescription>
                Securely connect your Xero accounting system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This integration allows you to securely connect your Xero account to our system.
                Once connected, you'll be able to sync financial data between platforms.
                Your Xero credentials are never stored in our system - we use secure OAuth 2.0
                authentication to access your data only when needed.
              </p>
            </CardContent>
          </Card>
          
          <div className="max-w-xl mx-auto">
            <XeroConnector />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default XeroIntegration;
