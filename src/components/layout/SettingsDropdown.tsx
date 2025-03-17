
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ShieldCheck, LogOut, Users, ChevronDown, CreditCard, ClipboardList } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';

interface SettingsDropdownProps {
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ isAdmin, canManageTeam, handleSignOut }) => {
  const { user } = useAuth();
  const [isRealAdmin, setIsRealAdmin] = React.useState(false);
  const location = useLocation();

  // Updated font size from text-sm to text-base for consistent sizing with NavLinks
  const navLinkClass = "font-medium text-base transition-colors flex items-center";
  const activeNavLinkClass = "text-brandPurple-600";
  const inactiveNavLinkClass = "text-gray-700 hover:text-brandPurple-500";
  
  // Active state for settings
  const isSettingsActive = location.pathname === '/profile' || 
                          location.pathname === '/team' || 
                          location.pathname === '/admin' ||
                          location.pathname === '/purchases' ||
                          location.pathname === '/custom-questions' ||
                          location.pathname === '/xero';

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
        <Button variant="ghost" className={`${navLinkClass} ${isSettingsActive ? activeNavLinkClass : inactiveNavLinkClass}`}>
          Settings
          <ChevronDown size={16} className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 mt-1">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center w-full">
            <User size={16} className="mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/purchases" className="flex items-center w-full">
            <CreditCard size={16} className="mr-2" />
            My Purchases
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/custom-questions" className="flex items-center w-full">
            <ClipboardList size={16} className="mr-2" />
            Custom Questions
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/team" className="flex items-center w-full">
            <Users size={16} className="mr-2" />
            Team
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/xero" className="flex items-center w-full">
            <Settings size={16} className="mr-2" />
            Xero Integration
          </Link>
        </DropdownMenuItem>
        
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
