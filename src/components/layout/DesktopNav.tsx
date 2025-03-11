
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavLinks from './NavLinks';
import SettingsDropdown from './SettingsDropdown';
import { usePermissions } from '../../hooks/usePermissions';

interface DesktopNavProps {
  isAuthenticated: boolean;
  hideAuthButtons: boolean;
  canManageTeam: boolean;
  isAdmin: boolean;
  handleSignOut: () => Promise<void>;
}

const DesktopNav: React.FC<DesktopNavProps> = ({
  isAuthenticated,
  hideAuthButtons,
  canManageTeam,
  isAdmin,
  handleSignOut,
}) => {
  // Additional check using the usePermissions hook directly
  const { userRole } = usePermissions();
  
  useEffect(() => {
    console.log('DesktopNav render - canManageTeam:', canManageTeam, 'userRole:', userRole);
  }, [canManageTeam, userRole]);

  return (
    <nav className="hidden md:flex space-x-8">
      {isAuthenticated ? (
        <>
          <NavLinks canManageTeam={canManageTeam} />
          <SettingsDropdown 
            isAdmin={isAdmin} 
            canManageTeam={canManageTeam} 
            handleSignOut={handleSignOut} 
          />
        </>
      ) : (
        // Only show login/signup options if not on survey response or complete pages
        !hideAuthButtons && (
          <>
            <Link to="/login" className="btn-ghost">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary">
              Sign up
            </Link>
          </>
        )
      )}
    </nav>
  );
};

export default DesktopNav;
