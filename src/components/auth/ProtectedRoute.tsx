
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  console.log('ProtectedRoute render - Path:', location.pathname, '- User:', user ? 'Authenticated' : 'Not authenticated', '- Loading:', isLoading);

  // Track loading time to detect excessive loading states
  useEffect(() => {
    let interval: number | undefined;
    
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000) as unknown as number;
    } else {
      setLoadingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Force proceed after excessive loading time (15 seconds)
  useEffect(() => {
    if (loadingTime > 15 && isLoading) {
      console.warn('ProtectedRoute - Loading timeout exceeded, forcing navigation');
      if (location.pathname.includes('/survey')) {
        // For survey routes, just show the content
        setRedirectAttempted(true);
      } else if (!redirectAttempted) {
        // For other routes, redirect to login
        navigate('/login');
        setRedirectAttempted(true);
      }
    }
  }, [loadingTime, isLoading, navigate, location.pathname, redirectAttempted]);

  // Handle authentication redirect logic
  useEffect(() => {
    console.log('ProtectedRoute useEffect - Loading:', isLoading, '- User exists:', !!user, '- Path:', location.pathname);
    
    // Skip auth check for survey routes to ensure they always load
    if (location.pathname.includes('/survey')) {
      console.log('ProtectedRoute - Skipping auth check for survey route');
      return;
    }
    
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user && !redirectAttempted) {
      console.log('ProtectedRoute - Redirecting to login from:', location.pathname);
      // Store the path the user was trying to access
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`);
      setRedirectAttempted(true);
    }
  }, [user, isLoading, navigate, location.pathname, location.search, redirectAttempted]);

  // Don't render anything until we've checked authentication, unless it's taking too long
  if (isLoading && loadingTime <= 15 && !location.pathname.includes('/survey')) {
    console.log('ProtectedRoute - Showing loading spinner');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading... ({loadingTime}s)</p>
          {loadingTime > 10 && (
            <p className="mt-2 text-sm text-gray-500">Taking longer than expected...</p>
          )}
        </div>
      </div>
    );
  }

  // If user is authenticated or we're on a survey page, render the protected content
  console.log('ProtectedRoute - Returning children:', !!user || location.pathname.includes('/survey'));
  return (user || location.pathname.includes('/survey') || loadingTime > 15) ? <>{children}</> : null;
};

export default ProtectedRoute;
