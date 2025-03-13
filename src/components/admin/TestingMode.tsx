
import React, { useState, useEffect } from 'react';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useTestingMode } from '../../contexts/TestingModeContext';
import { PlanType } from '../../lib/supabase/subscription';
import { UserRoleType } from '../../lib/supabase/client';

export function TestingMode() {
  const { 
    isTestingMode, 
    testingPlan, 
    testingRole, 
    enableTestingMode, 
    enableRoleTestingMode, 
    enableFullTestingMode, 
    disableTestingMode 
  } = useTestingMode();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(testingPlan || 'free');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(testingRole || 'viewer');

  // Update local state when context values change
  useEffect(() => {
    if (testingPlan) setSelectedPlan(testingPlan);
    if (testingRole) setSelectedRole(testingRole);
  }, [testingPlan, testingRole]);

  const handleEnableTestingMode = () => {
    enableFullTestingMode(selectedPlan, selectedRole);
  };

  const handleDisableTestingMode = () => {
    disableTestingMode();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Testing Mode</h2>
        <p className="text-muted-foreground">
          Simulate different subscription plans and user roles simultaneously to test and verify functionality.
        </p>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant={!isTestingMode ? "default" : "outline"}
          onClick={handleDisableTestingMode}
        >
          Normal Mode
        </Button>
        <Button 
          variant={isTestingMode ? "default" : "outline"}
          onClick={handleEnableTestingMode}
        >
          Testing Mode
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <label htmlFor="plan" className="text-sm font-medium">Subscription Plan:</label>
          <Select
            id="plan"
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as PlanType)}
          >
            <option value="free">Free</option>
            <option value="foundation">Foundation</option>
            <option value="progress">Progress</option>
            <option value="premium">Premium</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">User Role:</label>
          <Select
            id="role"
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as UserRoleType)}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="administrator">Administrator</option>
            <option value="group_admin">Group Admin</option>
            <option value="organization_admin">Organization Admin</option>
          </Select>
        </div>
      </div>

      {isTestingMode && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription>
            Testing Mode Active: Viewing app as <strong>{selectedPlan}</strong> subscriber with <strong>{selectedRole}</strong> role
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
