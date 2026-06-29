import { describe, it, expect, vi, afterEach } from 'vitest';
import { isFeatureEnabled, isFeatureEnvLocked } from '@/lib/featureRegistry';
import { setFeatureFlagOverrides, clearFeatureFlagOverrides } from '@/lib/featureFlagOverrides';

describe('featureFlagOverrides + registry merge', () => {
  afterEach(() => {
    clearFeatureFlagOverrides();
    vi.unstubAllEnvs();
  });

  it('runtime override disables an optional module', () => {
    setFeatureFlagOverrides({ marketplace: false });
    expect(isFeatureEnabled('marketplace')).toBe(false);
  });

  it('env false locks module even if runtime says enabled', () => {
    vi.stubEnv('VITE_FEATURE_CAREERS', 'false');
    setFeatureFlagOverrides({ careers: true });
    expect(isFeatureEnabled('careers')).toBe(false);
    expect(isFeatureEnvLocked('careers')).toBe(true);
  });

  it('runtime override enables when env is not false', () => {
    setFeatureFlagOverrides({ engagement: false });
    expect(isFeatureEnabled('engagement')).toBe(false);
    setFeatureFlagOverrides({ engagement: true });
    expect(isFeatureEnabled('engagement')).toBe(true);
  });
});
