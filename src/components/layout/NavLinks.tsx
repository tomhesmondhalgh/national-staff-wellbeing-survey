
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { usePermissions } from '../../hooks/usePermissions';

interface NavLinksProps {
  canManageTeam: boolean;
  setIsMenuOpen?: (isOpen: boolean) => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ canManageTeam, setIsMenuOpen }) => {
  const location = useLocation();
  const { userRole } = usePermissions();
  const { isPremium, isLoading } = useSubscription();
  
  useEffect(() => {
    console.log('NavLinks component - canManageTeam:', canManageTeam, 'userRole:', userRole);
  }, [canManageTeam, userRole]);
  
  const handleClick = () => {
    if (setIsMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <Link 
        to="/dashboard" 
        className={`nav-link ${location.pathname === '/dashboard' ? 'text-brandPurple-600' : ''}`}
        onClick={handleClick}
      >
        Dashboard
      </Link>
      <Link 
        to="/surveys" 
        className={`nav-link ${location.pathname.startsWith('/survey') ? 'text-brandPurple-600' : ''}`}
        onClick={handleClick}
      >
        Survey
      </Link>
      <Link 
        to="/analysis" 
        className={`nav-link ${location.pathname === '/analysis' ? 'text-brandPurple-600' : ''}`}
        onClick={handleClick}
      >
        Analyse
      </Link>
      <Link 
        to="/improve" 
        className={`nav-link ${location.pathname === '/improve' ? 'text-brandPurple-600' : ''}`}
        onClick={handleClick}
      >
        Improve
      </Link>
      
      {!isPremium && !isLoading && (
        <Link 
          to="/upgrade" 
          className={`nav-link ${location.pathname === '/upgrade' ? 'text-brandPurple-600' : ''}`}
          onClick={handleClick}
        >
          Upgrade
        </Link>
      )}
    </>
  );
};

export default NavLinks;
