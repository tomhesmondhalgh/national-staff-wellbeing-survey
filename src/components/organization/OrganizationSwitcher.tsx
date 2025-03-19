
import React from 'react';
import { Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';

const OrganizationSwitcher: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  
  // Don't render anything if not logged in or not an admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 text-sm">
      <Building size={16} />
      <span className="truncate max-w-[140px]">My Organisation</span>
    </div>
  );
};

export default OrganizationSwitcher;
