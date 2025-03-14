
import React from 'react';
import { Button } from '../../ui/button';

interface TestingModeToggleProps {
  isTestingMode: boolean;
  onEnableTestingMode: () => void;
  onDisableTestingMode: () => void;
}

export function TestingModeToggle({ 
  isTestingMode, 
  onEnableTestingMode, 
  onDisableTestingMode 
}: TestingModeToggleProps) {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={!isTestingMode ? "default" : "outline"}
        onClick={onDisableTestingMode}
      >
        Normal Mode
      </Button>
      <Button 
        variant={isTestingMode ? "default" : "outline"}
        onClick={onEnableTestingMode}
      >
        Testing Mode
      </Button>
    </div>
  );
}
