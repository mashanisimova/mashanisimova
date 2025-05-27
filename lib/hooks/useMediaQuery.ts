import { useState, useEffect } from 'react';

/**
 * Hook for detecting if the window matches a media query
 * @param query Media query string like '(max-width: 768px)'
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server or initial render to avoid hydration mismatch
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);

      // Define listener
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add listener
      media.addEventListener('change', listener);

      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    
    // Return false on server
    return undefined;
  }, [query]);

  return matches;
}
