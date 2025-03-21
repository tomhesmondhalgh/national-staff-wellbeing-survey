
import React, { useState, useEffect } from 'react';
import { ChevronDown, Building } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { usePermissions } from '../../hooks/usePermissions';
import { useTestingMode } from '../../contexts/TestingModeContext';

const OrganizationSwitcher: React.FC = () => {
  const { currentOrganization, organizations, switchOrganization, isLoading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const { userRole } = usePermissions();
  const { isTestingMode, testingRole } = useTestingMode();
  const [canSwitchOrganizations, setCanSwitchOrganizations] = useState(false);
  
  useEffect(() => {
    // Check if user has group admin permissions (either real or in testing mode)
    const isGroupAdmin = 
      userRole === 'group_admin' || 
      userRole === 'administrator' ||
      (isTestingMode && (testingRole === 'group_admin' || testingRole === 'administrator'));
      
    setCanSwitchOrganizations(isGroupAdmin);
  }, [userRole, isTestingMode, testingRole]);
  
  // Don't render anything if user can't switch organizations
  if (!canSwitchOrganizations) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm">
        <Building size={16} />
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500">
        <Building size={16} />
        <span>No organisation</span>
      </div>
    );
  }

  // Don't show switcher if there's only one organisation
  if (!organizations || organizations.length <= 1) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm">
        <Building size={16} />
        <span className="truncate max-w-[140px]">{currentOrganization.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 text-sm">
          <Building size={16} />
          <span className="truncate max-w-[140px]">{currentOrganization.name}</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              switchOrganization(org.id);
              setIsOpen(false);
            }}
            className={`flex items-center space-x-2 ${
              org.id === currentOrganization.id ? 'bg-muted' : ''
            }`}
          >
            <span className="truncate">{org.name}</span>
            {org.id === currentOrganization.id && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSwitcher;
