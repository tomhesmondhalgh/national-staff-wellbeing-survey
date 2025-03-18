
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ShieldCheck, LogOut, Users, ChevronDown, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';
import { useLocation } from 'react-router-dom';

interface SettingsDropdownProps {
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ isAdmin, canManageTeam, handleSignOut }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get access to the current admin status from our hook
  const { isAdmin: isAdminFromHook } = useAdminRole();

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
