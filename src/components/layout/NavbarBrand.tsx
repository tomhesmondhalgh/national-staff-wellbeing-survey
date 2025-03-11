
import React from 'react';
import { Link } from 'react-router-dom';

const NavbarBrand: React.FC = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="flex items-center">
        <img 
          src="/lovable-uploads/895356bb-776b-4070-8a89-a6e33e70cee6.png" 
          alt="Human Kind Staff Wellbeing Award" 
          className="h-24 md:h-30"
        />
      </Link>
    </div>
  );
};

export default NavbarBrand;
