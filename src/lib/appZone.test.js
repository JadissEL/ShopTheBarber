import { describe, it, expect } from 'vitest';
import { APP_ZONES } from '@/components/navigationConfig';
import {
  resolveZoneFromPath,
  isAuthAppModulePath,
  isMarketingOnlyPath,
} from '@/lib/appZone';

describe('appZone', () => {
  describe('isMarketingOnlyPath', () => {
    it('includes landing and GTM pages', () => {
      expect(isMarketingOnlyPath('/')).toBe(true);
      expect(isMarketingOnlyPath('/pricing')).toBe(true);
      expect(isMarketingOnlyPath('/for-barbers')).toBe(true);
      expect(isMarketingOnlyPath('/marketplace/seller-terms')).toBe(true);
    });

    it('excludes dashboard modules', () => {
      expect(isMarketingOnlyPath('/Explore')).toBe(false);
      expect(isMarketingOnlyPath('/HelpCenter')).toBe(false);
    });
  });

  describe('isAuthAppModulePath', () => {
    it('includes client sidebar discovery modules', () => {
      expect(isAuthAppModulePath('/Explore')).toBe(true);
      expect(isAuthAppModulePath('/Marketplace')).toBe(true);
      expect(isAuthAppModulePath('/Referral')).toBe(true);
      expect(isAuthAppModulePath('/GiftCards')).toBe(true);
      expect(isAuthAppModulePath('/ChampionshipLeaderboard')).toBe(true);
      expect(isAuthAppModulePath('/CareerHub')).toBe(true);
      expect(isAuthAppModulePath('/HelpCenter')).toBe(true);
    });

    it('excludes marketplace legal terms', () => {
      expect(isAuthAppModulePath('/marketplace/seller-terms')).toBe(false);
    });
  });

  describe('resolveZoneFromPath', () => {
    it('keeps guests on public layout for discovery modules', () => {
      expect(resolveZoneFromPath('/Explore')).toBe(APP_ZONES.PUBLIC);
      expect(resolveZoneFromPath('/HelpCenter')).toBe(APP_ZONES.PUBLIC);
    });

    it('places authenticated clients in client shell', () => {
      expect(
        resolveZoneFromPath('/Explore', { isAuthenticated: true, role: 'client', accountType: 'client' }),
      ).toBe(APP_ZONES.CLIENT);
    });

    it('places authenticated solo barbers in provider shell', () => {
      expect(
        resolveZoneFromPath('/Explore', { isAuthenticated: true, role: 'barber', accountType: 'solo_barber' }),
      ).toBe(APP_ZONES.PROVIDER);
      expect(
        resolveZoneFromPath('/Marketplace', { isAuthenticated: true, role: 'shop_owner', accountType: 'shop' }),
      ).toBe(APP_ZONES.PROVIDER);
    });

    it('places authenticated sellers in seller shell', () => {
      expect(
        resolveZoneFromPath('/Marketplace', { isAuthenticated: true, role: 'seller', accountType: 'seller' }),
      ).toBe(APP_ZONES.SELLER);
    });

    it('keeps authenticated admins in admin shell for all non-marketing routes', () => {
      expect(
        resolveZoneFromPath('/Explore', { isAuthenticated: true, role: 'admin' }),
      ).toBe(APP_ZONES.ADMIN);
      expect(
        resolveZoneFromPath('/Marketplace', { isAuthenticated: true, role: 'admin' }),
      ).toBe(APP_ZONES.ADMIN);
      expect(
        resolveZoneFromPath('/GlobalFinancials', { isAuthenticated: true, role: 'admin' }),
      ).toBe(APP_ZONES.ADMIN);
    });

    it('keeps marketing pages public when signed in', () => {
      expect(
        resolveZoneFromPath('/', { isAuthenticated: true, role: 'client' }),
      ).toBe(APP_ZONES.PUBLIC);
      expect(
        resolveZoneFromPath('/pricing', { isAuthenticated: true, role: 'barber' }),
      ).toBe(APP_ZONES.PUBLIC);
      expect(
        resolveZoneFromPath('/', { isAuthenticated: true, role: 'admin' }),
      ).toBe(APP_ZONES.PUBLIC);
    });

    it('preserves guest tool zones for route guards', () => {
      expect(resolveZoneFromPath('/GlobalFinancials')).toBe(APP_ZONES.ADMIN);
      expect(resolveZoneFromPath('/ProviderDashboard')).toBe(APP_ZONES.PROVIDER);
      expect(resolveZoneFromPath('/Dashboard')).toBe(APP_ZONES.CLIENT);
      expect(resolveZoneFromPath('/SetupGuide')).toBe(APP_ZONES.CLIENT);
    });

    it('places authenticated users in role shell on setup guide', () => {
      expect(
        resolveZoneFromPath('/SetupGuide', { isAuthenticated: true, role: 'client' }),
      ).toBe(APP_ZONES.CLIENT);
      expect(
        resolveZoneFromPath('/SetupGuide', { isAuthenticated: true, role: 'barber', accountType: 'solo_barber' }),
      ).toBe(APP_ZONES.PROVIDER);
      expect(
        resolveZoneFromPath('/SetupGuide', { isAuthenticated: true, role: 'admin' }),
      ).toBe(APP_ZONES.ADMIN);
    });
  });
});
