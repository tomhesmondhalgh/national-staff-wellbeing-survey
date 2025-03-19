
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
  setTestingPlan: (plan: PlanType | null) => void;
}

const TestingModeContext = createContext<TestingModeContextType | undefined>(undefined);

export function TestingModeProvider({ children }: { children: React.ReactNode }) {
  console.log('Initializing TestingModeProvider');
  
  // Initialize state from localStorage if available
  const [isTestingMode, setIsTestingMode] = useState<boolean>(() => {
    try {
      const savedMode = localStorage.getItem(TESTING_MODE_ENABLED_KEY);
      const parsedMode = savedMode ? JSON.parse(savedMode) : false;
      console.log('Testing mode from localStorage:', parsedMode);
      return parsedMode;
    } catch (error) {
      console.error('Error reading testing mode from localStorage:', error);
      return false;
    }
  });
  
  const [testingPlan, setTestingPlan] = useState<PlanType | null>(() => {
    try {
      const savedPlan = localStorage.getItem(TESTING_MODE_PLAN_KEY);
      console.log('Testing plan from localStorage:', savedPlan);
      return savedPlan ? (savedPlan as PlanType) : null;
    } catch (error) {
      console.error('Error reading testing plan from localStorage:', error);
      return null;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      console.log('Updating testing mode in localStorage:', isTestingMode);
      localStorage.setItem(TESTING_MODE_ENABLED_KEY, JSON.stringify(isTestingMode));
    } catch (error) {
      console.error('Error saving testing mode to localStorage:', error);
    }
  }, [isTestingMode]);

  useEffect(() => {
    try {
      if (testingPlan) {
        console.log('Updating testing plan in localStorage:', testingPlan);
        localStorage.setItem(TESTING_MODE_PLAN_KEY, testingPlan);
      } else {
        console.log('Removing testing plan from localStorage');
        localStorage.removeItem(TESTING_MODE_PLAN_KEY);
      }
    } catch (error) {
      console.error('Error saving testing plan to localStorage:', error);
    }
  }, [testingPlan]);

  const enableTestingMode = (plan: PlanType) => {
    console.log('Enabling testing mode with plan:', plan);
    setIsTestingMode(true);
    setTestingPlan(plan);
  };

  const disableTestingMode = () => {
    console.log('Disabling testing mode');
    setIsTestingMode(false);
    setTestingPlan(null);
  };

  const contextValue = {
    isTestingMode,
    testingPlan,
    enableTestingMode,
    disableTestingMode,
    setTestingPlan
  };

  console.log('TestingModeProvider current state:', contextValue);

  return (
    <TestingModeContext.Provider value={contextValue}>
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
