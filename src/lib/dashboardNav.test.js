import { describe, it, expect } from 'vitest';
import { getProviderMobileNav, getAdminMobileNav, flattenNavGroups } from '@/lib/dashboardNav';

describe('dashboardNav', () => {
  it('builds provider primary tabs from Daily group', () => {
    const { primary, more } = getProviderMobileNav({ isManager: false, isSolo: true });
    expect(primary.map((item) => item.page)).toEqual([
      'ProviderDashboard',
      'ProviderBookings',
      'ProviderMessages',
      'ProviderPayouts',
    ]);
    expect(more.some((item) => item.page === 'ProviderSettings')).toBe(true);
    expect(more.some((item) => item.page === 'MyJobs')).toBe(true);
  });

  it('includes shop team items for managers', () => {
    const { more } = getProviderMobileNav({ isManager: true, isSolo: false });
    expect(more.some((item) => item.page === 'StaffRoster')).toBe(true);
  });

  it('builds admin primary tabs from Platform group', () => {
    const { primary, more } = getAdminMobileNav();
    expect(primary).toHaveLength(4);
    expect(primary[0].page).toBe('GlobalFinancials');
    expect(more.some((item) => item.page === 'AdminSupportInbox')).toBe(true);
    expect(more.some((item) => item.page === 'AdminFeatureToggles')).toBe(true);
  });

  it('dedupes flattened nav groups', () => {
    const groups = [
      { title: 'A', items: [{ page: 'X', label: 'X' }, { page: 'Y', label: 'Y' }] },
      { title: 'B', items: [{ page: 'X', label: 'X dup' }, { page: 'Z', label: 'Z' }] },
    ];
    expect(flattenNavGroups(groups).map((i) => i.page)).toEqual(['X', 'Y', 'Z']);
  });
});
