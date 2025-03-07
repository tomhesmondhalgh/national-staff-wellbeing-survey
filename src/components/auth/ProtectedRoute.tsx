
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      // Check if user is not authenticated
      if (!user) {
        // Store the path the user was trying to access
        const returnTo = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?returnTo=${returnTo}`);
      }
      // Check if route requires admin access but user is not an admin
      else if (requireAdmin && !isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, navigate, location]);

  // Don't render anything until we've checked authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is authenticated and admin check passes, render the protected content
  return user && (!requireAdmin || isAdmin) ? <>{children}</> : null;
};

export default ProtectedRoute;
