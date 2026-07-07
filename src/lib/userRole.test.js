import { describe, it, expect } from 'vitest';
import {
  isProviderRole,
  isAdminRole,
  canAccessProviderTools,
  resolveEffectiveRole,
  dashboardPageForRole,
  settingsPageForRole,
  canAccessBookingProviderTools,
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

  it('uses account type as canonical routing identity', () => {
    expect(
      resolveEffectiveRole({
        accountType: 'solo_barber',
        authRole: 'client',
      }),
    ).toBe('barber');
    expect(
      resolveEffectiveRole({
        accountType: 'seller',
        authRole: 'client',
      }),
    ).toBe('seller');
  });

  it('routes each role to its dashboard and settings', () => {
    expect(dashboardPageForRole('barber')).toBe('ProviderDashboard');
    expect(dashboardPageForRole('seller')).toBe('SellerDashboard');
    expect(dashboardPageForRole('client')).toBe('Dashboard');
    expect(dashboardPageForRole('admin')).toBe('GlobalFinancials');
    expect(settingsPageForRole('seller')).toBe('SellerSettings');
  });

  it('restricts booking tools to barber account types', () => {
    expect(canAccessBookingProviderTools('solo_barber')).toBe(true);
    expect(canAccessBookingProviderTools('seller')).toBe(false);
  });
});
