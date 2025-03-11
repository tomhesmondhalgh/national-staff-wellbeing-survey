
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ShieldCheck, LogOut, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface SettingsDropdownProps {
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ isAdmin, canManageTeam, handleSignOut }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="nav-link p-0 h-auto font-normal">
          <span className="flex items-center">
            <Settings size={16} className="mr-1" />
            Settings
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center w-full">
            <User size={16} className="mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        {canManageTeam && (
          <DropdownMenuItem asChild>
            <Link to="/team" className="flex items-center w-full">
              <Users size={16} className="mr-2" />
              Team
            </Link>
          </DropdownMenuItem>
        )}
        
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center w-full">
              <ShieldCheck size={16} className="mr-2" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;
