import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PlanType } from '../lib/supabase/subscription';
import { UserRoleType } from '../lib/supabase/types';
import { toast } from 'sonner';

// Local storage keys
const TESTING_MODE_ENABLED_KEY = 'testing_mode_enabled';
const TESTING_MODE_PLAN_KEY = 'testing_mode_plan';
const TESTING_MODE_ROLE_KEY = 'testing_mode_role';

// Middleware types
type TestingModeAction = 
  | { type: 'ENABLE_TESTING_MODE'; payload: { plan: PlanType; role: UserRoleType } }
  | { type: 'ENABLE_PLAN_TESTING'; payload: { plan: PlanType } }
  | { type: 'ENABLE_ROLE_TESTING'; payload: { role: UserRoleType } }
  | { type: 'UPDATE_TESTING_PLAN'; payload: { plan: PlanType } }
  | { type: 'UPDATE_TESTING_ROLE'; payload: { role: UserRoleType } }
  | { type: 'DISABLE_TESTING_MODE' };

// Middleware function type
type TestingModeMiddleware = (
  action: TestingModeAction,
  next: (action: TestingModeAction) => void
) => void;

// Core context state interface
interface TestingModeState {
  isTestingMode: boolean;
  testingPlan: PlanType | null;
  testingRole: UserRoleType | null;
}

// Context interface with actions
interface TestingModeContextType extends TestingModeState {
  enableTestingMode: (plan: PlanType) => void;
  enableRoleTestingMode: (role: UserRoleType) => void;
  enableFullTestingMode: (plan: PlanType, role: UserRoleType) => void;
  disableTestingMode: () => void;
  setTestingPlan: (plan: PlanType | null) => void;
  setTestingRole: (role: UserRoleType | null) => void;
}

// Create the context with a more specific undefined type check
const TestingModeContext = createContext<TestingModeContextType | undefined>(undefined);

// Provider props interface
interface TestingModeProviderProps {
  children: React.ReactNode;
  middleware?: TestingModeMiddleware[];
}

// Logging middleware
const loggingMiddleware: TestingModeMiddleware = (action, next) => {
  // Only log the payload if it exists
  if ('payload' in action) {
    console.log('TestingMode action:', action.type, action.payload);
  } else {
    console.log('TestingMode action:', action.type);
  }
  next(action);
};

// Toast notification middleware
const notificationMiddleware: TestingModeMiddleware = (action, next) => {
  next(action);
  
  // Show notifications after state changes
  switch (action.type) {
    case 'ENABLE_TESTING_MODE':
      toast.success(`Testing mode enabled: ${action.payload.plan} plan with ${action.payload.role} role`);
      break;
    case 'DISABLE_TESTING_MODE':
      toast.info('Testing mode disabled');
      break;
    case 'UPDATE_TESTING_PLAN':
      toast.success(`Testing plan changed to: ${action.payload.plan}`);
      break;
    case 'UPDATE_TESTING_ROLE':
      toast.success(`Testing role changed to: ${action.payload.role}`);
      break;
  }
};

export function TestingModeProvider({ 
  children, 
  middleware = [loggingMiddleware, notificationMiddleware] 
}: TestingModeProviderProps) {
  // Initialize state from localStorage if available
  const [state, setState] = useState<TestingModeState>(() => {
    try {
      return {
        isTestingMode: JSON.parse(localStorage.getItem(TESTING_MODE_ENABLED_KEY) || 'false'),
        testingPlan: localStorage.getItem(TESTING_MODE_PLAN_KEY) as PlanType || null,
        testingRole: localStorage.getItem(TESTING_MODE_ROLE_KEY) as UserRoleType || null
      };
    } catch (error) {
      console.error('Error reading testing mode from localStorage:', error);
      return {
        isTestingMode: false,
        testingPlan: null,
        testingRole: null
      };
    }
  });

  // Middleware dispatcher
  const dispatch = useCallback((action: TestingModeAction) => {
    let index = 0;
    
    const executeMiddleware = (currentAction: TestingModeAction) => {
      if (index < middleware.length) {
        middleware[index++](currentAction, executeMiddleware);
      } else {
        // Apply state changes at the end of middleware chain
        setState(prevState => {
          switch (currentAction.type) {
            case 'ENABLE_TESTING_MODE':
              return {
                isTestingMode: true,
                testingPlan: currentAction.payload.plan,
                testingRole: currentAction.payload.role
              };
            case 'ENABLE_PLAN_TESTING':
              return {
                ...prevState,
                isTestingMode: true,
                testingPlan: currentAction.payload.plan
              };
            case 'ENABLE_ROLE_TESTING':
              return {
                ...prevState,
                isTestingMode: true,
                testingRole: currentAction.payload.role
              };
            case 'UPDATE_TESTING_PLAN':
              return {
                ...prevState,
                testingPlan: currentAction.payload.plan
              };
            case 'UPDATE_TESTING_ROLE':
              return {
                ...prevState,
                testingRole: currentAction.payload.role
              };
            case 'DISABLE_TESTING_MODE':
              return {
                isTestingMode: false,
                testingPlan: null,
                testingRole: null
              };
            default:
              return prevState;
          }
        });
      }
    };
    
    executeMiddleware(action);
  }, [middleware]);

  // Persist state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(TESTING_MODE_ENABLED_KEY, JSON.stringify(state.isTestingMode));
      
      if (state.testingPlan) {
        localStorage.setItem(TESTING_MODE_PLAN_KEY, state.testingPlan);
      } else {
        localStorage.removeItem(TESTING_MODE_PLAN_KEY);
      }
      
      if (state.testingRole) {
        localStorage.setItem(TESTING_MODE_ROLE_KEY, state.testingRole);
      } else {
        localStorage.removeItem(TESTING_MODE_ROLE_KEY);
      }
    } catch (error) {
      console.error('Error saving testing mode to localStorage:', error);
    }
  }, [state]);

  // Action creators with dispatch
  const enableTestingMode = useCallback((plan: PlanType) => {
    dispatch({
      type: 'ENABLE_PLAN_TESTING',
      payload: { plan }
    });
  }, [dispatch]);

  const enableRoleTestingMode = useCallback((role: UserRoleType) => {
    dispatch({
      type: 'ENABLE_ROLE_TESTING',
      payload: { role }
    });
  }, [dispatch]);

  const enableFullTestingMode = useCallback((plan: PlanType, role: UserRoleType) => {
    dispatch({
      type: 'ENABLE_TESTING_MODE',
      payload: { plan, role }
    });
  }, [dispatch]);

  const disableTestingMode = useCallback(() => {
    dispatch({ type: 'DISABLE_TESTING_MODE' });
  }, [dispatch]);

  const setTestingPlan = useCallback((plan: PlanType | null) => {
    if (plan) {
      dispatch({
        type: 'UPDATE_TESTING_PLAN',
        payload: { plan }
      });
    }
  }, [dispatch]);

  const setTestingRole = useCallback((role: UserRoleType | null) => {
    if (role) {
      dispatch({
        type: 'UPDATE_TESTING_ROLE',
        payload: { role }
      });
    }
  }, [dispatch]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    enableTestingMode,
    enableRoleTestingMode,
    enableFullTestingMode,
    disableTestingMode,
    setTestingPlan,
    setTestingRole
  }), [
    state,
    enableTestingMode,
    enableRoleTestingMode,
    enableFullTestingMode,
    disableTestingMode,
    setTestingPlan,
    setTestingRole
  ]);

  return (
    <TestingModeContext.Provider value={contextValue}>
      {children}
    </TestingModeContext.Provider>
  );
}

// Split hook into smaller hooks for selective context consumption

// Hook for consuming the entire context
export function useTestingMode() {
  const context = useContext(TestingModeContext);
  if (context === undefined) {
    throw new Error('useTestingMode must be used within a TestingModeProvider');
  }
  return context;
}

// Selector hook for testing mode status only
export function useTestingModeStatus() {
  const context = useContext(TestingModeContext);
  if (context === undefined) {
    throw new Error('useTestingModeStatus must be used within a TestingModeProvider');
  }
  return {
    isTestingMode: context.isTestingMode,
    testingPlan: context.testingPlan,
    testingRole: context.testingRole
  };
}

// Selector hook for testing mode actions only
export function useTestingModeActions() {
  const context = useContext(TestingModeContext);
  if (context === undefined) {
    throw new Error('useTestingModeActions must be used within a TestingModeProvider');
  }
  return {
    enableTestingMode: context.enableTestingMode,
    enableRoleTestingMode: context.enableRoleTestingMode,
    enableFullTestingMode: context.enableFullTestingMode,
    disableTestingMode: context.disableTestingMode,
    setTestingPlan: context.setTestingPlan,
    setTestingRole: context.setTestingRole
  };
}
