
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAdminRole } from '../hooks/useAdminRole';
import { useTestingMode } from '../contexts/TestingModeContext';
import { PlanType } from '../lib/supabase/subscription';
import { UserRoleType } from '../lib/supabase/client';
import { Card } from '../components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Admin = () => {
  const [sendingTestEmails, setSendingTestEmails] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { 
    isTestingMode, 
    testingPlan, 
    testingRole, 
    setTestingPlan,
    setTestingRole,
    disableTestingMode 
  } = useTestingMode();

  const handleSendTestEmails = async () => {
    try {
      setSendingTestEmails(true);
      
      const { data, error } = await supabase.functions.invoke('send-test-emails', {
        body: {
          email: user?.email || 'tomhesmondhalghce@gmail.com'
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Test emails result:", data);
      toast.success("Test emails sent", {
        description: "Check your inbox for the test emails."
      });
    } catch (error) {
      console.error("Error sending test emails:", error);
      toast.error("Failed to send test emails", {
        description: "There was a problem sending the test emails. Please try again."
      });
    } finally {
      setSendingTestEmails(false);
    }
  };

  const handleTestingModeChange = (enabled: boolean) => {
    if (!enabled) {
      disableTestingMode();
    } else if (!isTestingMode) {
      // Enable testing mode with default values if not already enabled
      setTestingPlan('free');
      setTestingRole('viewer');
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <PageTitle 
            title="Access Denied" 
            subtitle="You do not have permission to access this page"
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle 
          title="Admin Dashboard" 
          subtitle="Manage your application and users"
        />
        
        <div className="mt-8 grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Testing Mode</h2>
            <p className="mb-4">Simulate different subscription plans and user roles simultaneously to test and verify functionality.</p>
            
            <div className="space-y-6">
              {/* Testing Mode Toggle */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleTestingModeChange(false)}
                  variant={!isTestingMode ? "default" : "outline"}
                  className="w-32"
                >
                  Normal Mode
                </Button>
                <Button
                  onClick={() => handleTestingModeChange(true)}
                  variant={isTestingMode ? "default" : "outline"}
                  className="w-32"
                >
                  Testing Mode
                </Button>
              </div>

              {/* Testing Mode Options (visible only when testing mode is enabled) */}
              {isTestingMode && (
                <div className="bg-muted/30 p-4 rounded-md space-y-4 border">
                  <div>
                    <h3 className="font-medium mb-2">Subscription Plan:</h3>
                    <Select
                      value={testingPlan || 'free'}
                      onValueChange={(value) => setTestingPlan(value as PlanType)}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select subscription plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['free', 'foundation', 'progress', 'premium'] as PlanType[]).map((plan) => (
                          <SelectItem key={plan} value={plan} className="capitalize">
                            {plan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">User Role:</h3>
                    <Select
                      value={testingRole || 'viewer'}
                      onValueChange={(value) => setTestingRole(value as UserRoleType)}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['administrator', 'group_admin', 'organization_admin', 'editor', 'viewer'] as UserRoleType[]).map((role) => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                    Testing Mode Active: 
                    {testingPlan && <span> Viewing app as <strong className="capitalize">{testingPlan}</strong> subscriber</span>}
                    {testingRole && <span> with <strong>{testingRole.replace('_', ' ')}</strong> role</span>}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email Testing</h2>
            <p className="mb-4">Send test emails to verify that the email functionality is working correctly.</p>
            <Button
              onClick={handleSendTestEmails}
              disabled={sendingTestEmails}
              className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white"
            >
              {sendingTestEmails ? "Sending..." : "Send Test Emails"}
            </Button>
          </div>
          
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
