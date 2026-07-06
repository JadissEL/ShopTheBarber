import { describe, it, expect } from 'vitest';
import { resolveDashboardBreadcrumbs, shouldShowDashboardBreadcrumbs, getDashboardBackLink } from '@/lib/dashboardBreadcrumbs';

describe('dashboardBreadcrumbs', () => {
  it('hides breadcrumbs on primary client nav routes', () => {
    expect(resolveDashboardBreadcrumbs('/Dashboard')).toBeNull();
    expect(resolveDashboardBreadcrumbs('/Explore')).toBeNull();
    expect(resolveDashboardBreadcrumbs('/Chat')).toBeNull();
  });

  it('shows module breadcrumbs for secondary destinations', () => {
    expect(resolveDashboardBreadcrumbs('/Marketplace')).toEqual([
      expect.objectContaining({ label: 'Dashboard', page: 'Dashboard' }),
      expect.objectContaining({ label: 'Marketplace', current: true }),
    ]);
    expect(resolveDashboardBreadcrumbs('/Referral')).toEqual([
      expect.objectContaining({ label: 'Dashboard' }),
      expect.objectContaining({ label: 'Refer & Earn', current: true }),
    ]);
  });

  it('shows detail trails with parent module', () => {
    const crumbs = resolveDashboardBreadcrumbs('/BarberProfile?id=abc');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[1]).toMatchObject({ label: 'Explore', page: 'Explore' });
    expect(crumbs[2]).toMatchObject({ label: 'Barber profile', current: true });
  });

  it('uses dynamic titles on detail pages', () => {
    const crumbs = resolveDashboardBreadcrumbs('/BarberProfile', {
      dynamicTitle: 'Jay the Barber',
    });
    expect(crumbs?.[2]).toMatchObject({ label: 'Jay the Barber', current: true });
  });

  it('uses dynamic titles on booking flow', () => {
    const crumbs = resolveDashboardBreadcrumbs('/BookingFlow', {
      dynamicTitle: 'Jay Styles',
    });
    expect(crumbs?.[2]).toMatchObject({ label: 'Jay Styles', current: true });
  });

  it('uses provider dashboard root for provider role', () => {
    const crumbs = resolveDashboardBreadcrumbs('/Marketplace', { role: 'barber' });
    expect(crumbs?.[0]).toMatchObject({ page: 'ProviderDashboard', label: 'Dashboard' });
  });

    it('shows admin console breadcrumbs', () => {
      const crumbs = resolveDashboardBreadcrumbs('/AdminDisputes', { role: 'admin' });
      expect(crumbs?.[0]).toMatchObject({ page: 'GlobalFinancials', label: 'Admin' });
      expect(crumbs?.[1]).toMatchObject({ label: 'Disputes', current: true });
    });

    it('shows provider editor breadcrumb trails', () => {
      const crumbs = resolveDashboardBreadcrumbs('/BlogArticleEditor', { role: 'barber' });
      expect(crumbs).toHaveLength(3);
      expect(crumbs?.[1]).toMatchObject({ page: 'ProviderBlogArticles', label: 'Blog articles' });
    });

  it('resolves contextual back link from breadcrumb parent', () => {
    expect(
      getDashboardBackLink('/BarberProfile', { role: 'client' }),
    ).toMatchObject({ label: 'Explore', href: '/Explore' });
  });

  it('shouldShowDashboardBreadcrumbs mirrors resolver', () => {
    expect(shouldShowDashboardBreadcrumbs('/Explore')).toBe(false);
    expect(shouldShowDashboardBreadcrumbs('/HelpCenter')).toBe(true);
  });
});
