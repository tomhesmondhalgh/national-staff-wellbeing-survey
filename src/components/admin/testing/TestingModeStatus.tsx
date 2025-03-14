
import React from 'react';
import { Alert, AlertDescription } from '../../ui/alert';

interface TestingModeStatusProps {
  isTestingMode: boolean;
  selectedPlan: string;
  selectedRole: string;
}

export function TestingModeStatus({ 
  isTestingMode, 
  selectedPlan, 
  selectedRole 
}: TestingModeStatusProps) {
  if (!isTestingMode) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertDescription>
        Testing Mode Active: Viewing app as <strong>{selectedPlan}</strong> subscriber with <strong>{selectedRole}</strong> role
      </AlertDescription>
    </Alert>
  );
}
