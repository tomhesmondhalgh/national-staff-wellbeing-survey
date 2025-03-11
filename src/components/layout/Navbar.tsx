
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';
import { usePermissions } from '../../hooks/usePermissions';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const permissions = usePermissions();
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check if current page is a survey response or survey completion page
  const hideAuthButtons = location.pathname === '/survey' || location.pathname === '/survey-complete';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user can manage team
  useEffect(() => {
    const checkTeamPermission = async () => {
      if (permissions && !permissions.isLoading) {
        const canManage = await permissions.canManageTeam();
        setCanManageTeam(canManage);
      }
    };
    
    checkTeamPermission();
  }, [permissions]);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="font-serif text-2xl font-bold text-brandPurple-700 tracking-tight">
              Wellbeing<span className="text-brandPurple-500">Survey</span>
            </Link>
          </div>
          
          {/* Organization Switcher (only show when logged in) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center ml-4">
              <OrganizationSwitcher />
            </div>
          )}
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'text-brandPurple-600' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/surveys" 
                  className={`nav-link ${location.pathname === '/surveys' || location.pathname === '/new-survey' ? 'text-brandPurple-600' : ''}`}
                >
                  Survey
                </Link>
                <Link 
                  to="/analysis" 
                  className={`nav-link ${location.pathname === '/analysis' ? 'text-brandPurple-600' : ''}`}
                >
                  Analyse
                </Link>
                <Link 
                  to="/improve" 
                  className={`nav-link ${location.pathname === '/improve' ? 'text-brandPurple-600' : ''}`}
                >
                  Improve
                </Link>
                {canManageTeam && (
                  <Link 
                    to="/team" 
                    className={`nav-link ${location.pathname === '/team' ? 'text-brandPurple-600' : ''}`}
                  >
                    <span className="flex items-center">
                      <Users size={16} className="mr-1" />
                      Team
                    </span>
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className={`nav-link ${location.pathname === '/profile' ? 'text-brandPurple-600' : ''}`}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${location.pathname === '/admin' ? 'text-brandPurple-600' : ''}`}
                  >
                    Admin
                  </Link>
                )}
                <button className="nav-link" onClick={handleSignOut}>Sign Out</button>
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
          
          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-brandPurple-600 hover:bg-brandPurple-50 focus:outline-none"
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
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
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/surveys" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Survey
                </Link>
                <Link 
                  to="/analysis" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Analyse
                </Link>
                <Link 
                  to="/improve" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Improve
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
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button 
                  className="block w-full text-left px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={handleSignOut}
                >
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
      )}
    </header>
  );
}

export default Navbar;
