
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ShieldCheck, LogOut, Users, ChevronDown, CreditCard, SwitchCamera } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';
import { usePermissions } from '../../hooks/usePermissions';
import { useLocation } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';

interface SettingsDropdownProps {
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ isAdmin, canManageTeam, handleSignOut }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get access to the current admin status from our hooks
  const { isAdmin: isAdminFromHook, isUsingNewRoleSystem: adminUsingNewSystem } = useAdminRole();
  const { isUsingNewRoleSystem, enableNewRoleSystem, disableNewRoleSystem } = usePermissions();

  const navLinkClass = "text-base font-medium text-gray-600 hover:text-brandPurple-600 transition-colors flex items-center";
  const activeNavLinkClass = "text-purple-700";
  
  // Active state for settings
  const isSettingsActive = location.pathname === '/profile' || 
                          location.pathname === '/team' || 
                          location.pathname === '/admin' ||
                          location.pathname === '/purchases' ||
                          location.pathname === '/custom-questions';

  // Use either the admin status passed as prop or from the hook
  const showAdminLink = isAdmin || isAdminFromHook;
  
  // Handler to toggle role system
  const handleToggleRoleSystem = () => {
    if (isUsingNewRoleSystem) {
      disableNewRoleSystem();
    } else {
      enableNewRoleSystem();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`${navLinkClass} ${isSettingsActive ? activeNavLinkClass : ""}`}>
          Settings
          <ChevronDown size={16} className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 mt-1 p-1">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center w-full py-2">
            <User size={16} className="mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/purchases" className="flex items-center w-full py-2">
            <CreditCard size={16} className="mr-2" />
            My Purchases
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/team" className="flex items-center w-full py-2">
            <Users size={16} className="mr-2" />
            Team
          </Link>
        </DropdownMenuItem>
        
        {/* Show Admin link if user has admin access */}
        {showAdminLink && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center w-full py-2">
              <ShieldCheck size={16} className="mr-2" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        
        {/* Role System Toggle (only visible for admins) */}
        {showAdminLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center py-2">
                <SwitchCamera size={16} className="mr-2" />
                Role System
                {isUsingNewRoleSystem && (
                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 border-green-200 text-green-700">New</Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[200px]">
                  <DropdownMenuItem onClick={handleToggleRoleSystem}>
                    {isUsingNewRoleSystem 
                      ? "Switch to Classic System" 
                      : "Switch to New System"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Currently using: {isUsingNewRoleSystem ? "New" : "Classic"} system
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center py-2">
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;
