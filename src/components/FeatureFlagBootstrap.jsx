import { useEffect } from 'react';
import { sovereign } from '@/api/apiClient';
import { setFeatureFlagOverrides } from '@/lib/featureFlagOverrides';

/** Loads runtime feature-flag overrides once at app startup (no auth required). */
export default function FeatureFlagBootstrap({ children }) {
  useEffect(() => {
    let cancelled = false;
    sovereign.featureFlags
      .getPublic()
      .then((data) => {
        if (!cancelled && data?.flags) setFeatureFlagOverrides(data.flags);
      })
      .catch(() => {
        if (!cancelled) setFeatureFlagOverrides(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
