/** Runtime DB overrides fetched from GET /api/feature-flags (merged on client with env gates). */

/** @type {Record<string, boolean> | null} */
let overrides = null;

/** @type {Set<() => void>} */
const listeners = new Set();

/** @param {Record<string, boolean> | null} map */
export function setFeatureFlagOverrides(map) {
  overrides = map && typeof map === 'object' ? { ...map } : null;
  listeners.forEach((fn) => fn());
}

/** @param {string} featureId @returns {boolean | undefined} */
export function getFeatureFlagOverride(featureId) {
  if (!overrides || !(featureId in overrides)) return undefined;
  return overrides[featureId];
}

/** @param {() => void} fn */
export function subscribeFeatureFlagOverrides(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearFeatureFlagOverrides() {
  overrides = null;
  listeners.forEach((fn) => fn());
}
