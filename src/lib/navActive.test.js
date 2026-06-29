import { describe, it, expect } from 'vitest';
import { isNavActive, roleLabel } from './navActive';

describe('isNavActive', () => {
  it('matches explore and dashboard routes', () => {
    expect(isNavActive('/Explore', 'Explore')).toBe(true);
    expect(isNavActive('/dashboard', 'Dashboard')).toBe(true);
    expect(isNavActive('/ProviderDashboard', 'ProviderDashboard')).toBe(true);
  });

  it('avoids false positives on partial strings', () => {
    expect(isNavActive('/AdminUserModeration', 'Admin')).toBe(false);
    expect(isNavActive('/ProviderBookings', 'ProviderDashboard')).toBe(false);
  });

  it('matches career hub sub-routes', () => {
    expect(isNavActive('/careerhub/jobs', 'CareerHub')).toBe(true);
  });
});

describe('roleLabel', () => {
  it('returns readable role names', () => {
    expect(roleLabel('shop_owner')).toBe('Shop owner');
    expect(roleLabel('admin')).toBe('Admin');
  });
});
