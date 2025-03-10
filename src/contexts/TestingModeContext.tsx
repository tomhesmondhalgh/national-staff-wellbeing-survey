
import React, { createContext, useContext, useState } from 'react';
import { PlanType } from '../lib/supabase/subscription';

interface TestingModeContextType {
  isTestingMode: boolean;
  testingPlan: PlanType | null;
  enableTestingMode: (plan: PlanType) => void;
  disableTestingMode: () => void;
}

const TestingModeContext = createContext<TestingModeContextType | undefined>(undefined);

export function TestingModeProvider({ children }: { children: React.ReactNode }) {
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [testingPlan, setTestingPlan] = useState<PlanType | null>(null);

  const enableTestingMode = (plan: PlanType) => {
    setIsTestingMode(true);
    setTestingPlan(plan);
  };

  const disableTestingMode = () => {
    setIsTestingMode(false);
    setTestingPlan(null);
  };

  return (
    <TestingModeContext.Provider value={{
      isTestingMode,
      testingPlan,
      enableTestingMode,
      disableTestingMode
    }}>
      {children}
    </TestingModeContext.Provider>
  );
}

export function useTestingMode() {
  const context = useContext(TestingModeContext);
  if (context === undefined) {
    throw new Error('useTestingMode must be used within a TestingModeProvider');
  }
  return context;
}
