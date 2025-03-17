
import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';

interface NavLinksProps {
  closeMobileMenu?: () => void;
  canManageTeam?: boolean;
  setIsMenuOpen?: (isOpen: boolean) => void;
}

interface NavLinkProps {
  to: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, onClick, children }) => {
  return (
    <RouterNavLink
      to={to}
      className={`block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent ${
        active
          ? 'font-bold text-blue-700 dark:text-white'
          : ''
      }`}
      onClick={onClick}
    >
      {children}
    </RouterNavLink>
  );
};

export const NavLinks: React.FC<NavLinksProps> = ({ 
  closeMobileMenu,
  setIsMenuOpen
}) => {
  const location = useLocation();
  
  // Helper to check if a route is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Helper to close mobile menu when a link is clicked
  const handleLinkClick = () => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
    if (setIsMenuOpen) {
      setIsMenuOpen(false);
    }
  };
  
  // Only include main navigation items (Dashboard, Survey, Analyse, Improve, Upgrade)
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center">
      <NavLink 
        to="/dashboard" 
        active={isActive('/dashboard')} 
        onClick={handleLinkClick}
      >
        Dashboard
      </NavLink>
      
      <NavLink 
        to="/surveys" 
        active={isActive('/surveys')} 
        onClick={handleLinkClick}
      >
        Survey
      </NavLink>
      
      <NavLink 
        to="/analysis" 
        active={isActive('/analysis')} 
        onClick={handleLinkClick}
      >
        Analyse
      </NavLink>
      
      <NavLink 
        to="/improve" 
        active={isActive('/improve')} 
        onClick={handleLinkClick}
      >
        Improve
      </NavLink>
      
      <NavLink 
        to="/upgrade" 
        active={isActive('/upgrade')} 
        onClick={handleLinkClick}
      >
        Upgrade
      </NavLink>
    </div>
  );
};
