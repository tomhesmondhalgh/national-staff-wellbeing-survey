
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
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SettingsDropdownProps {
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ isAdmin, canManageTeam, handleSignOut }) => {
  const { user } = useAuth();
  const [isRealAdmin, setIsRealAdmin] = React.useState(false);

  // Check if user is a real admin (not just in testing mode)
  React.useEffect(() => {
    const checkRealAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'administrator')
          .maybeSingle();
          
        if (error) {
          console.error('Error checking real admin status:', error);
          return;
        }
        
        setIsRealAdmin(!!data);
      } catch (error) {
        console.error('Error in admin check:', error);
      }
    };
    
    checkRealAdmin();
  }, [user]);

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
        
        {/* Show Admin link if user is either in testing mode as admin OR a real admin */}
        {(isAdmin || isRealAdmin) && (
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
