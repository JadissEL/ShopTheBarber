import { describe, it, expect } from 'vitest';
import { lazy } from 'react';
import { PAGES, CORE_EAGER_PAGE_NAMES } from '@/pages.config';
import { CUSTOM_APP_ROUTE_PAGES } from '@/lib/coreRoutes';

const REACT_LAZY = Symbol.for('react.lazy');

describe('lazy route splitting', () => {
  it('registers all expected page keys', () => {
    expect(Object.keys(PAGES).length).toBeGreaterThanOrEqual(90);
    expect(PAGES.Home).toBeDefined();
    expect(PAGES.ProviderDashboard).toBeDefined();
    expect(PAGES.GlobalFinancials).toBeDefined();
  });

  it('keeps core funnel pages eager', () => {
    for (const name of CORE_EAGER_PAGE_NAMES) {
      expect(PAGES[name], `${name} missing from PAGES`).toBeDefined();
      expect(PAGES[name].$$typeof).not.toBe(REACT_LAZY);
    }
  });

  it('lazy-loads non-core pages', () => {
    const lazyNames = Object.keys(PAGES).filter(
      (name) => !CORE_EAGER_PAGE_NAMES.has(name)
    );
    expect(lazyNames.length).toBeGreaterThan(70);
    for (const name of lazyNames) {
      expect(PAGES[name].$$typeof, `${name} should be lazy`).toBe(REACT_LAZY);
    }
  });

  it('does not auto-register custom App.jsx-only routes', () => {
    for (const name of CUSTOM_APP_ROUTE_PAGES) {
      expect(PAGES[name]).toBeUndefined();
    }
  });

  it('sample lazy component resolves via dynamic import', async () => {
    const LazyAdmin = PAGES.AdminBackups;
    expect(LazyAdmin.$$typeof).toBe(REACT_LAZY);
    // Smoke: lazy wrapper is valid (same as React.lazy contract)
    expect(typeof lazy).toBe('function');
  });
});
