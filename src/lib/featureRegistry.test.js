import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  getFeatureForPage,
  isPathFeatureEnabled,
  getClientNavItems,
  getPublicNavItems,
  getPublicBusinessNavItems,
  listFeatureModules,
} from '@/lib/featureRegistry';

describe('featureRegistry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('always enables core and admin modules', () => {
    expect(isFeatureEnabled('core')).toBe(true);
    expect(isFeatureEnabled('admin')).toBe(true);
  });

  it('disables optional module when env is false', () => {
    vi.stubEnv('VITE_FEATURE_TOMBOLA', undefined);
    vi.stubEnv('VITE_FEATURE_ENGAGEMENT', 'false');
    expect(isFeatureEnabled('engagement')).toBe(false);
  });

  it('maps pages to features', () => {
    expect(getFeatureForPage('Marketplace')).toBe('marketplace');
    expect(getFeatureForPage('CareerHub')).toBe('careers');
    expect(getFeatureForPage('Dashboard')).toBe('core');
  });

  it('checks pathname feature gates', () => {
    vi.stubEnv('VITE_FEATURE_CAREERS', 'false');
    expect(isPathFeatureEnabled('/CareerHub')).toBe(false);
    expect(isPathFeatureEnabled('/Explore')).toBe(true);
  });

  it('filters client nav by enabled features', () => {
    vi.stubEnv('VITE_FEATURE_MARKETPLACE', 'false');
    const items = getClientNavItems();
    expect(items.some((i) => i.page === 'Marketplace')).toBe(false);
    expect(items.some((i) => i.page === 'Dashboard')).toBe(true);
  });

  it('filters public nav', () => {
    vi.stubEnv('VITE_FEATURE_MARKETPLACE', 'false');
    expect(getPublicNavItems().some((i) => i.path === 'Marketplace')).toBe(false);
  });

  it('returns business nav items', () => {
    const items = getPublicBusinessNavItems();
    expect(items.some((i) => i.path === '/for-networks')).toBe(true);
    expect(items.some((i) => i.path === '/pricing')).toBe(true);
  });

  it('lists modules for admin overview', () => {
    const modules = listFeatureModules();
    expect(modules.find((m) => m.id === 'core')?.alwaysOn).toBe(true);
    expect(modules.length).toBeGreaterThan(5);
  });
});
