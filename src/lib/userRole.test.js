import { describe, it, expect } from 'vitest';
import {
  isProviderRole,
  isAdminRole,
  canAccessProviderTools,
  resolveEffectiveRole,
  dashboardPageForRole,
  settingsPageForRole,
} from '@/lib/userRole';

describe('userRole', () => {
  it('detects provider roles without admin', () => {
    expect(isProviderRole('barber')).toBe(true);
    expect(isProviderRole('shop_owner')).toBe(true);
    expect(isProviderRole('client')).toBe(false);
    expect(isProviderRole('admin')).toBe(false);
  });

  it('detects admin separately from providers', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('barber')).toBe(false);
    expect(canAccessProviderTools('admin')).toBe(false);
    expect(canAccessProviderTools('barber')).toBe(true);
  });

  it('infers barber from workspace when auth role is client', () => {
    expect(
      resolveEffectiveRole({
        authRole: 'client',
        barber: { title: 'Independent Barber' },
        ownerMembership: true,
        providerIntent: 'barber',
      }),
    ).toBe('barber');
  });

  it('infers shop_owner from workspace title', () => {
    expect(
      resolveEffectiveRole({
        authRole: 'client',
        barber: { title: 'Shop Owner' },
        ownerMembership: true,
      }),
    ).toBe('shop_owner');
  });

  it('uses provider intent before workspace exists', () => {
    expect(
      resolveEffectiveRole({
        authRole: 'client',
        providerIntent: 'barber',
      }),
    ).toBe('barber');
  });

  it('routes each role to its dashboard and settings', () => {
    expect(dashboardPageForRole('barber')).toBe('ProviderDashboard');
    expect(dashboardPageForRole('client')).toBe('Dashboard');
    expect(dashboardPageForRole('admin')).toBe('GlobalFinancials');
    expect(settingsPageForRole('admin')).toBe('AdminPlatformHealth');
    expect(settingsPageForRole('client')).toBe('AccountSettings');
  });
});
