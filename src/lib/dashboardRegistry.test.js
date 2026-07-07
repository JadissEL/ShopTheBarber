import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_REGISTRY,
  resolveDashboardPage,
  isAdaptiveProviderDashboard,
} from './dashboardRegistry';

describe('dashboardRegistry', () => {
  it('maps each account type to a unique dashboard page key', () => {
    expect(DASHBOARD_REGISTRY.client).toBe('Dashboard');
    expect(DASHBOARD_REGISTRY.solo_barber).toBe('ProviderDashboard');
    expect(DASHBOARD_REGISTRY.shop).toBe('ProviderDashboard');
    expect(DASHBOARD_REGISTRY.seller).toBe('SellerDashboard');
    expect(DASHBOARD_REGISTRY.company).toBe('CompanyDashboard');
    expect(DASHBOARD_REGISTRY.blogger).toBe('BloggerDashboard');
  });

  it('resolves dashboard page from account type', () => {
    expect(resolveDashboardPage('seller')).toBe('SellerDashboard');
    expect(resolveDashboardPage('blogger')).toBe('BloggerDashboard');
  });

  it('identifies adaptive provider dashboard types', () => {
    expect(isAdaptiveProviderDashboard('solo_barber')).toBe(true);
    expect(isAdaptiveProviderDashboard('shop')).toBe(true);
    expect(isAdaptiveProviderDashboard('seller')).toBe(false);
  });
});
