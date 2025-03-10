
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlanType } from '../lib/supabase/subscription';

// Local storage keys
const TESTING_MODE_ENABLED_KEY = 'testing_mode_enabled';
const TESTING_MODE_PLAN_KEY = 'testing_mode_plan';

interface TestingModeContextType {
  isTestingMode: boolean;
  testingPlan: PlanType | null;
  enableTestingMode: (plan: PlanType) => void;
  disableTestingMode: () => void;
}

const TestingModeContext = createContext<TestingModeContextType | undefined>(undefined);

export function TestingModeProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage if available
  const [isTestingMode, setIsTestingMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem(TESTING_MODE_ENABLED_KEY);
    return savedMode ? JSON.parse(savedMode) : false;
  });
  
  const [testingPlan, setTestingPlan] = useState<PlanType | null>(() => {
    const savedPlan = localStorage.getItem(TESTING_MODE_PLAN_KEY);
    return savedPlan ? (savedPlan as PlanType) : null;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem(TESTING_MODE_ENABLED_KEY, JSON.stringify(isTestingMode));
  }, [isTestingMode]);

  useEffect(() => {
    if (testingPlan) {
      localStorage.setItem(TESTING_MODE_PLAN_KEY, testingPlan);
    } else {
      localStorage.removeItem(TESTING_MODE_PLAN_KEY);
    }
  }, [testingPlan]);

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
