
import { useState, useEffect } from 'react';

/**
 * A hook that returns whether a media query matches.
 * 
 * @param query The media query to match against
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (for SSR compatibility)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    
    // Set matches immediately
    updateMatches();
    
    // Update matches when the media query changes
    mediaQuery.addEventListener('change', updateMatches);
    
    // Clean up event listener
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]);

  return matches;
}
