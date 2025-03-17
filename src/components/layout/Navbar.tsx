
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';
import { usePermissions } from '../../hooks/usePermissions';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';
import NavbarBrand from './NavbarBrand';
import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { userRole } = usePermissions();
  
  const isAuthenticated = !!user;
  
  const hideAuthButtons = location.pathname === '/survey' || location.pathname === '/survey-complete';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (userRole === 'administrator' || userRole === 'group_admin' || userRole === 'organization_admin') {
      setCanManageTeam(true);
    } else {
      setCanManageTeam(false);
    }
    
    console.log('Current user role in Navbar:', userRole, '- Can manage team:', 
      (userRole === 'administrator' || userRole === 'group_admin' || userRole === 'organization_admin'));
  }, [userRole]);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <NavbarBrand />
          
          {isAuthenticated && (
            <div className="hidden md:flex items-center ml-4">
              <OrganizationSwitcher />
            </div>
          )}
          
          <DesktopNav 
            isAuthenticated={isAuthenticated}
            hideAuthButtons={hideAuthButtons}
            canManageTeam={canManageTeam}
            isAdmin={isAdmin}
            handleSignOut={handleSignOut}
          />
          
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
      
      <MobileMenu 
        isOpen={isMenuOpen}
        isAuthenticated={isAuthenticated}
        hideAuthButtons={hideAuthButtons}
        isAdmin={isAdmin}
        canManageTeam={canManageTeam}
        handleSignOut={handleSignOut}
        setIsMenuOpen={setIsMenuOpen}
      />
    </header>
  );
}

export default Navbar;
