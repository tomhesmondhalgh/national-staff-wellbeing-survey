
import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, LogOut, Users } from 'lucide-react';
import NavLinks from './NavLinks';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  hideAuthButtons: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
  handleSignOut: () => Promise<void>;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  isAuthenticated,
  hideAuthButtons,
  isAdmin,
  canManageTeam,
  handleSignOut,
  setIsMenuOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white shadow-lg animate-slide-down">
      {/* Organization Switcher for mobile */}
      {isAuthenticated && (
        <div className="px-4 pt-3">
          <OrganizationSwitcher />
        </div>
      )}
      
      <div className="px-2 pt-2 pb-3 space-y-1">
        {isAuthenticated ? (
          <>
            <div className="flex flex-col space-y-1">
              <NavLinks canManageTeam={canManageTeam} setIsMenuOpen={setIsMenuOpen} />
            </div>
            
            {/* Settings Section Header */}
            <div className="px-4 pt-2 pb-1 text-sm font-semibold text-gray-500">
              Settings
            </div>
            
            {/* Settings Items */}
            <Link 
              to="/profile" 
              className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex items-center">
                <User size={16} className="mr-1" />
                Profile
              </span>
            </Link>
            
            {canManageTeam && (
              <Link 
                to="/team" 
                className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center">
                  <Users size={16} className="mr-1" />
                  Team
                </span>
              </Link>
            )}
            
            {isAdmin && (
              <Link 
                to="/admin" 
                className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center">
                  <ShieldCheck size={16} className="mr-1" />
                  Admin
                </span>
              </Link>
            )}
            
            <button 
              className="flex items-center w-full text-left px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="mr-1" />
              Sign Out
            </button>
          </>
        ) : (
          // Only show login/signup options if not on survey response or complete pages
          !hideAuthButtons && (
            <>
              <Link 
                to="/login" 
                className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="block px-4 py-2 rounded-md font-medium text-brandPurple-600 hover:bg-brandPurple-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
