
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';

const Admin = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Admin Dashboard" 
          subtitle="Manage your application and users"
        />
        
        <div className="mt-8 grid gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p>This is where administrators can manage users and roles.</p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <p>Configure system-wide settings and preferences.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Admin;
