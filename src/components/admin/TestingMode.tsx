
import React, { useState } from 'react';
import { useTestingMode } from '@/contexts/TestingModeContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PlanType } from '@/lib/supabase/subscription';
import { UserRoleType } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

const TestingMode = () => {
  const { 
    isTestingMode, 
    testingPlan,
    testingRole,
    enableTestingMode,
    enableRoleTestingMode,
    enableFullTestingMode,
    disableTestingMode,
    setTestingPlan,
    setTestingRole
  } = useTestingMode();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(testingPlan || 'free');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(testingRole || 'viewer');
  const [activeTab, setActiveTab] = useState<'plan' | 'role' | 'full'>('full');

  const handleToggleTestingMode = (enabled: boolean) => {
    if (!enabled) {
      disableTestingMode();
      toast({
        title: 'Testing Mode Disabled',
        description: 'You are now using your actual subscription and role',
      });
      return;
    }

    // Enable based on which tab is active
    switch (activeTab) {
      case 'plan':
        enableTestingMode(selectedPlan);
        toast({
          title: 'Plan Testing Mode Enabled',
          description: `Testing with ${selectedPlan} plan`,
        });
        break;
      case 'role':
        enableRoleTestingMode(selectedRole);
        toast({
          title: 'Role Testing Mode Enabled',
          description: `Testing with ${selectedRole} role`,
        });
        break;
      case 'full':
        enableFullTestingMode(selectedPlan, selectedRole);
        toast({
          title: 'Full Testing Mode Enabled',
          description: `Testing with ${selectedPlan} plan and ${selectedRole} role`,
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Testing Mode</h2>
          <p className="text-muted-foreground">
            Simulate different subscription plans and user roles for testing purposes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={isTestingMode} 
            onCheckedChange={handleToggleTestingMode}
            id="testing-mode-toggle"
          />
          <Label htmlFor="testing-mode-toggle">
            {isTestingMode ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>

      <Card className="p-6">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'plan' | 'role' | 'full')}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="full">Full Mode</TabsTrigger>
            <TabsTrigger value="plan">Plan Only</TabsTrigger>
            <TabsTrigger value="role">Role Only</TabsTrigger>
          </TabsList>
          
          <TabsContent value="full" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Subscription Plan</h3>
                <div className="flex flex-col space-y-2">
                  {(['free', 'foundation', 'progress', 'premium'] as PlanType[]).map((plan) => (
                    <label 
                      key={plan} 
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100"
                    >
                      <input 
                        type="radio" 
                        name="plan" 
                        value={plan} 
                        checked={selectedPlan === plan} 
                        onChange={() => setSelectedPlan(plan)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="capitalize">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">User Role</h3>
                <div className="flex flex-col space-y-2">
                  {(['administrator', 'group_admin', 'organization_admin', 'editor', 'viewer'] as UserRoleType[]).map((role) => (
                    <label 
                      key={role} 
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100"
                    >
                      <input 
                        type="radio" 
                        name="role" 
                        value={role} 
                        checked={selectedRole === role} 
                        onChange={() => setSelectedRole(role)}
                        className="h-4 w-4 text-primary"
                      />
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                enableFullTestingMode(selectedPlan, selectedRole);
                toast({
                  title: 'Testing Mode Updated',
                  description: `Testing with ${selectedPlan} plan and ${selectedRole} role`,
                });
              }} 
              disabled={!isTestingMode}
              className="mt-4"
            >
              Apply Settings
            </Button>
          </TabsContent>
          
          <TabsContent value="plan" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Subscription Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['free', 'foundation', 'progress', 'premium'] as PlanType[]).map((plan) => (
                  <button
                    key={plan}
                    className={`p-4 border rounded-lg text-center capitalize transition-colors ${
                      selectedPlan === plan 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => {
                enableTestingMode(selectedPlan);
                toast({
                  title: 'Plan Testing Mode Updated',
                  description: `Testing with ${selectedPlan} plan`,
                });
              }} 
              disabled={!isTestingMode}
              className="mt-4"
            >
              Apply Plan
            </Button>
          </TabsContent>
          
          <TabsContent value="role" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">User Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['administrator', 'group_admin', 'organization_admin', 'editor', 'viewer'] as UserRoleType[]).map((role) => (
                  <button
                    key={role}
                    className={`p-4 border rounded-lg text-center capitalize transition-colors ${
                      selectedRole === role 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => {
                enableRoleTestingMode(selectedRole);
                toast({
                  title: 'Role Testing Mode Updated',
                  description: `Testing with ${selectedRole} role`,
                });
              }} 
              disabled={!isTestingMode}
              className="mt-4"
            >
              Apply Role
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {isTestingMode && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="bg-yellow-200 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Testing Mode Active</h3>
              <p className="text-yellow-700 mt-1">
                You are currently viewing the application with modified permissions.
              </p>
              <div className="mt-2 space-y-1 text-sm">
                {testingPlan && (
                  <p className="text-yellow-800">
                    <span className="font-medium">Plan:</span> {testingPlan}
                  </p>
                )}
                {testingRole && (
                  <p className="text-yellow-800">
                    <span className="font-medium">Role:</span> {testingRole.replace('_', ' ')}
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  disableTestingMode();
                  toast({
                    title: 'Testing Mode Disabled',
                    description: 'You are now using your actual subscription and role',
                  });
                }}
                className="mt-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Exit Testing Mode
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TestingMode;
