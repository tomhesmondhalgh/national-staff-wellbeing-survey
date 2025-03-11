
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

  // Updated font size from text-sm to text-base for navigation links
  const navLinkClass = "nav-link font-medium text-base transition-colors";
  const activeNavLinkClass = "text-brandPurple-600";
  const inactiveNavLinkClass = "text-gray-700 hover:text-brandPurple-500";

  return (
    <>
      <Link 
        to="/dashboard" 
        className={`${navLinkClass} ${location.pathname === '/dashboard' ? activeNavLinkClass : inactiveNavLinkClass}`}
        onClick={handleClick}
      >
        Dashboard
      </Link>
      <Link 
        to="/surveys" 
        className={`${navLinkClass} ${location.pathname.startsWith('/survey') ? activeNavLinkClass : inactiveNavLinkClass}`}
        onClick={handleClick}
      >
        Survey
      </Link>
      <Link 
        to="/analysis" 
        className={`${navLinkClass} ${location.pathname === '/analysis' ? activeNavLinkClass : inactiveNavLinkClass}`}
        onClick={handleClick}
      >
        Analyse
      </Link>
      <Link 
        to="/improve" 
        className={`${navLinkClass} ${location.pathname === '/improve' ? activeNavLinkClass : inactiveNavLinkClass}`}
        onClick={handleClick}
      >
        Improve
      </Link>
      
      {!isPremium && !isLoading && (
        <Link 
          to="/upgrade" 
          className={`${navLinkClass} ${location.pathname === '/upgrade' ? activeNavLinkClass : inactiveNavLinkClass}`}
          onClick={handleClick}
        >
          Upgrade
        </Link>
      )}
    </>
  );
};

export default NavLinks;
