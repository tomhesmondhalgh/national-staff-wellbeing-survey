
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the path the user was trying to access
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`);
    }
  }, [user, isLoading, navigate, location]);

  // Don't render anything until we've checked authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
