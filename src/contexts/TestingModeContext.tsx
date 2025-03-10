
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
  console.log('TestingModeProvider initializing');
  
  // Initialize state from localStorage if available
  const [isTestingMode, setIsTestingMode] = useState<boolean>(() => {
    console.log('Initializing testing mode from localStorage');
    try {
      const savedMode = localStorage.getItem(TESTING_MODE_ENABLED_KEY);
      console.log('Retrieved testing mode from localStorage:', savedMode);
      return savedMode ? JSON.parse(savedMode) : false;
    } catch (error) {
      console.error('Error reading testing mode from localStorage:', error);
      return false;
    }
  });
  
  const [testingPlan, setTestingPlan] = useState<PlanType | null>(() => {
    console.log('Initializing testing plan from localStorage');
    try {
      const savedPlan = localStorage.getItem(TESTING_MODE_PLAN_KEY);
      console.log('Retrieved testing plan from localStorage:', savedPlan);
      return savedPlan ? (savedPlan as PlanType) : null;
    } catch (error) {
      console.error('Error reading testing plan from localStorage:', error);
      return null;
    }
  });

  console.log('TestingModeProvider initial state - isTestingMode:', isTestingMode, '- testingPlan:', testingPlan);

  // Update localStorage when state changes
  useEffect(() => {
    console.log('Updating isTestingMode in localStorage:', isTestingMode);
    try {
      localStorage.setItem(TESTING_MODE_ENABLED_KEY, JSON.stringify(isTestingMode));
    } catch (error) {
      console.error('Error saving testing mode to localStorage:', error);
    }
  }, [isTestingMode]);

  useEffect(() => {
    console.log('Updating testingPlan in localStorage:', testingPlan);
    try {
      if (testingPlan) {
        localStorage.setItem(TESTING_MODE_PLAN_KEY, testingPlan);
      } else {
        localStorage.removeItem(TESTING_MODE_PLAN_KEY);
      }
    } catch (error) {
      console.error('Error saving testing plan to localStorage:', error);
    }
  }, [testingPlan]);

  const enableTestingMode = (plan: PlanType) => {
    console.log('enableTestingMode called with plan:', plan);
    setIsTestingMode(true);
    setTestingPlan(plan);
  };

  const disableTestingMode = () => {
    console.log('disableTestingMode called');
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
