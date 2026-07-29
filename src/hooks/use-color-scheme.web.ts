import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web-specific override of useColorScheme.
 *
 * Strategy:
 * - Before hydration: read window.matchMedia synchronously so the initial
 *   render already reflects the OS preference (no flash, no wrong default).
 * - After hydration: subscribe to the RN implementation which in turn listens
 *   to the browser's prefers-color-scheme media query for reactive updates.
 */
function getInitialColorScheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  // Pre-hydration: use synchronous matchMedia instead of hardcoded 'light'
  return getInitialColorScheme();
}
