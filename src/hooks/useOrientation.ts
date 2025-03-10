
import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape' | undefined;

export function useOrientation(): { 
  orientation: Orientation,
  isMobile: boolean
} {
  const [orientation, setOrientation] = useState<Orientation>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to detect orientation
    const updateOrientation = () => {
      // First check if we're on a mobile device
      const mobileCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck);
      
      if (mobileCheck) {
        if (window.matchMedia("(orientation: portrait)").matches) {
          setOrientation('portrait');
        } else {
          setOrientation('landscape');
        }
      } else {
        // Not a mobile device
        setOrientation(undefined);
      }
    };

    // Initial check
    updateOrientation();

    // Add event listeners
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return { orientation, isMobile };
}
