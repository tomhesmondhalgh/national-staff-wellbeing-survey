
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { usePermissions } from '../hooks/usePermissions';
import { Navigate } from 'react-router-dom';

const Team = () => {
  const { canManageTeam, isLoading } = usePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await canManageTeam();
      setHasPermission(result);
    };

    if (!isLoading) {
      checkPermission();
    }
  }, [isLoading, canManageTeam]);

  // Show loading state while checking permissions
  if (isLoading || hasPermission === null) {
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
  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Team Management" 
          subtitle="Manage members and permissions for your organization"
          className="mb-8"
        />
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-center text-gray-500">
            Team management functionality will be implemented here.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;
