
import React from 'react';
import { Link } from 'react-router-dom';

const NavbarBrand: React.FC = () => {
  return (
    <div className="flex-shrink-0">
      <Link to="/" className="font-serif text-2xl font-bold text-brandPurple-700 tracking-tight">
        Wellbeing<span className="text-brandPurple-500">Survey</span>
      </Link>
    </div>
  );
};

export default NavbarBrand;
