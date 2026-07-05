import { describe, it, expect } from 'vitest';
import {
  isProviderRole,
  resolveEffectiveRole,
  dashboardPageForRole,
} from '@/lib/userRole';

describe('userRole', () => {
  it('detects provider roles', () => {
    expect(isProviderRole('barber')).toBe(true);
    expect(isProviderRole('shop_owner')).toBe(true);
    expect(isProviderRole('client')).toBe(false);
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

  it('routes providers to ProviderDashboard', () => {
    expect(dashboardPageForRole('barber')).toBe('ProviderDashboard');
    expect(dashboardPageForRole('client')).toBe('Dashboard');
  });
});
