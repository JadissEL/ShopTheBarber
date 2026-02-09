import { useState, useEffect } from 'react';

/**
 * Match a media query string. Updates when the match changes.
 * @param {string} query - e.g. '(min-width: 1024px)'
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Desktop: ≥1024px (Tailwind lg) */
export const DESKTOP_QUERY = '(min-width: 1024px)';

export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY);
}
