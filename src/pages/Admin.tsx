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
import { Card } from '../components/ui/card';

const Admin = () => {
  const [sendingTestEmails, setSendingTestEmails] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isTestingMode, testingPlan, enableTestingMode, disableTestingMode } = useTestingMode();

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
            <p className="mb-4">Simulate different subscription plans to test and verify functionality.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => disableTestingMode()}
                  variant={!isTestingMode ? "outline" : "secondary"}
                  className="w-32"
                >
                  Normal Mode
                </Button>
                {(['free', 'foundation', 'progress', 'premium'] as PlanType[]).map((plan) => (
                  <Button
                    key={plan}
                    onClick={() => enableTestingMode(plan)}
                    variant={isTestingMode && testingPlan === plan ? "outline" : "secondary"}
                    className="w-32 capitalize"
                  >
                    {plan}
                  </Button>
                ))}
              </div>
              
              {isTestingMode && (
                <p className="text-sm text-yellow-600">
                  Testing Mode Active: Viewing app as {testingPlan} user
                </p>
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
