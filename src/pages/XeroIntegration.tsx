
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { PageTitle } from '@/components/ui/PageTitle';
import XeroConnector from '@/components/integrations/XeroConnector';

const XeroIntegration = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <PageTitle>Xero Integration</PageTitle>
        <p className="text-muted-foreground mb-8">
          Connect your Xero account to integrate with your accounting system.
        </p>
        
        <div className="mt-8 max-w-xl mx-auto">
          <XeroConnector />
        </div>
      </div>
    </MainLayout>
  );
};

export default XeroIntegration;
