/** Session fallback when OAuth/Clerk drops the `return` query param. */
export const AUTH_RETURN_KEY = 'stb_auth_return';

/**
 * @param {string | undefined | null} path
 */
export function stashAuthReturn(path) {
  if (typeof window === 'undefined' || !path?.startsWith('/')) return;
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, path);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @param {string} [fallback='/SetupGuide']
 * @returns {string}
 */
export function consumeAuthReturn(fallback = '/SetupGuide') {
  if (typeof window === 'undefined') return fallback;
  try {
    const stashed = sessionStorage.getItem(AUTH_RETURN_KEY);
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    if (stashed?.startsWith('/')) return stashed;
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Prefer explicit redirect from URL; fall back to stashed path (OAuth).
 * @param {string | null | undefined} queryRedirect
 * @param {string} [fallback='/SetupGuide']
 * @returns {string}
 */
export function resolvePostAuthDestination(queryRedirect, fallback = '/SetupGuide') {
  if (queryRedirect?.startsWith('/')) return queryRedirect;
  return consumeAuthReturn(fallback);
}
