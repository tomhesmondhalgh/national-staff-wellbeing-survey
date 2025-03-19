
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated, authCheckComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute effect running:', 
      'authenticated:', isAuthenticated, 
      'loading:', isLoading, 
      'check complete:', authCheckComplete);
    
    if (!isLoading && authCheckComplete && !isAuthenticated) {
      // Store the path the user was trying to access for later redirect
      const currentPath = location.pathname + location.search;
      const returnTo = encodeURIComponent(currentPath);
      
      console.log('User not authenticated, redirecting to login with returnTo:', returnTo);
      
      // Redirect to login with the return path
      navigate(`/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, isLoading, authCheckComplete, navigate, location]);

  // Don't render anything until we've checked authentication
  if (isLoading || !authCheckComplete) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
