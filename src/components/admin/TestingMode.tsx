
import React, { useState, useEffect } from 'react';
import { useTestingMode } from '../../contexts/TestingModeContext';
import { PlanType } from '../../lib/supabase/subscription';
import { UserRoleType } from '../../lib/supabase/types';
import { TestingModeToggle } from './testing/TestingModeToggle';
import { PlanSelector } from './testing/PlanSelector';
import { RoleSelector } from './testing/RoleSelector';
import { TestingModeStatus } from './testing/TestingModeStatus';

export function TestingMode() {
  const { 
    isTestingMode, 
    testingPlan, 
    testingRole, 
    enableFullTestingMode, 
    disableTestingMode,
    setTestingPlan,
    setTestingRole
  } = useTestingMode();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(testingPlan || 'free');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(testingRole || 'viewer');

  // Update local state when context values change
  useEffect(() => {
    if (testingPlan) setSelectedPlan(testingPlan);
  }, [testingPlan]);

  useEffect(() => {
    if (testingRole) setSelectedRole(testingRole);
  }, [testingRole]);

  const handleEnableTestingMode = () => {
    enableFullTestingMode(selectedPlan, selectedRole);
  };

  const handleDisableTestingMode = () => {
    disableTestingMode();
  };

  // When local selections change, update the context if testing mode is active
  const handlePlanChange = (plan: PlanType) => {
    setSelectedPlan(plan);
    if (isTestingMode) {
      setTestingPlan(plan);
    }
  };

  const handleRoleChange = (role: UserRoleType) => {
    setSelectedRole(role);
    if (isTestingMode) {
      setTestingRole(role);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Testing Mode</h2>
        <p className="text-muted-foreground">
          Simulate different subscription plans and user roles simultaneously to test and verify functionality.
        </p>
      </div>

      <TestingModeToggle 
        isTestingMode={isTestingMode}
        onEnableTestingMode={handleEnableTestingMode}
        onDisableTestingMode={handleDisableTestingMode}
      />

      <div className="grid gap-6">
        <PlanSelector 
          selectedPlan={selectedPlan} 
          onPlanChange={handlePlanChange} 
        />
        
        <RoleSelector 
          selectedRole={selectedRole} 
          onRoleChange={handleRoleChange} 
        />
      </div>

      <TestingModeStatus 
        isTestingMode={isTestingMode}
        selectedPlan={selectedPlan}
        selectedRole={selectedRole}
      />
    </div>
  );
}
