
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check if current page is a survey response form
  const isSurveyResponsePage = location.pathname === '/survey';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                  Surveys
                </Link>
                <Link 
                  to="/analysis" 
                  className={`nav-link ${location.pathname === '/analysis' ? 'text-brandPurple-600' : ''}`}
                >
                  Analysis
                </Link>
                <Link 
                  to="/profile" 
                  className={`nav-link ${location.pathname === '/profile' ? 'text-brandPurple-600' : ''}`}
                >
                  Profile
                </Link>
                <button className="nav-link" onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              // Only show login/signup options if not on survey response page
              !isSurveyResponsePage && (
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
                  Surveys
                </Link>
                <Link 
                  to="/analysis" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Analysis
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button 
                  className="block w-full text-left px-4 py-2 rounded-md font-medium hover:bg-brandPurple-50"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </>
            ) : (
              // Only show login/signup options if not on survey response page
              !isSurveyResponsePage && (
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
};

export default Navbar;
