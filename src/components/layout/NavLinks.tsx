
import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';

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
  const { isAdmin } = useAdminRole();
  
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
        Surveys
      </NavLink>
      
      <NavLink 
        to="/analysis" 
        active={isActive('/analysis')} 
        onClick={handleLinkClick}
      >
        Analysis
      </NavLink>
      
      <NavLink 
        to="/improve" 
        active={isActive('/improve')} 
        onClick={handleLinkClick}
      >
        Improve
      </NavLink>
      
      <NavLink 
        to="/team" 
        active={isActive('/team')} 
        onClick={handleLinkClick}
      >
        Team
      </NavLink>
      
      <NavLink 
        to="/custom-questions" 
        active={isActive('/custom-questions')} 
        onClick={handleLinkClick}
      >
        Custom Questions
      </NavLink>
      
      <NavLink 
        to="/xero" 
        active={isActive('/xero')} 
        onClick={handleLinkClick}
      >
        Xero
      </NavLink>
      
      {isAdmin && (
        <NavLink 
          to="/admin" 
          active={isActive('/admin')} 
          onClick={handleLinkClick}
        >
          Admin
        </NavLink>
      )}
    </div>
  );
};
