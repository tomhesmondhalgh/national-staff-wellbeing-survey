
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users } from 'lucide-react';

interface NavLinksProps {
  canManageTeam: boolean;
  setIsMenuOpen?: (isOpen: boolean) => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ canManageTeam, setIsMenuOpen }) => {
  const location = useLocation();
  
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
      
      <Link 
        to="/team" 
        className={`nav-link flex items-center ${location.pathname === '/team' ? 'text-brandPurple-600' : ''}`}
        onClick={handleClick}
        data-testid="team-link"
      >
        <Users size={16} className="mr-1" />
        Team
      </Link>
    </>
  );
};

export default NavLinks;
