
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

  console.log('ProtectedRoute render - Path:', location.pathname, '- User:', user ? 'Authenticated' : 'Not authenticated', '- Loading:', isLoading);

  useEffect(() => {
    console.log('ProtectedRoute useEffect - Loading:', isLoading, '- User exists:', !!user, '- Path:', location.pathname);
    
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user) {
      console.log('ProtectedRoute - Redirecting to login from:', location.pathname);
      // Store the path the user was trying to access
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`);
    }
    // Not including location.pathname and location.search in the dependency array
    // to prevent redirect loops
  }, [user, isLoading, navigate]);

  // Don't render anything until we've checked authentication
  if (isLoading) {
    console.log('ProtectedRoute - Showing loading spinner');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  console.log('ProtectedRoute - Returning children:', !!user);
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
