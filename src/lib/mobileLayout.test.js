import { describe, it, expect } from 'vitest';
import { APP_ZONES } from '@/components/navigationConfig';
import {
  shouldHideBottomNav,
  shouldShowClientBottomNav,
  shouldShowProviderBottomNav,
  shouldHideGlobalNavOnMobile,
} from '@/lib/mobileLayout';

describe('mobileLayout', () => {
  describe('shouldHideBottomNav', () => {
    it('hides on booking and checkout flows', () => {
      expect(shouldHideBottomNav('/BookingFlow')).toBe(true);
      expect(shouldHideBottomNav('/checkout')).toBe(true);
      expect(shouldHideBottomNav('/ConfirmBooking')).toBe(true);
      expect(shouldHideBottomNav('/PaymentSuccess')).toBe(true);
    });

    it('allows normal client pages', () => {
      expect(shouldHideBottomNav('/Dashboard')).toBe(false);
      expect(shouldHideBottomNav('/Explore')).toBe(false);
      expect(shouldHideBottomNav('/UserBookings')).toBe(false);
    });
  });

  describe('shouldShowClientBottomNav', () => {
    it('shows for authenticated mobile users on tab pages', () => {
      expect(
        shouldShowClientBottomNav({
          pathname: '/Dashboard',
          isAuthenticated: true,
          isDesktop: false,
        }),
      ).toBe(true);
    });

    it('hides for guests, desktop, and focus flows', () => {
      expect(
        shouldShowClientBottomNav({
          pathname: '/Dashboard',
          isAuthenticated: false,
          isDesktop: false,
        }),
      ).toBe(false);
      expect(
        shouldShowClientBottomNav({
          pathname: '/Dashboard',
          isAuthenticated: true,
          isDesktop: true,
        }),
      ).toBe(false);
      expect(
        shouldShowClientBottomNav({
          pathname: '/BookingFlow',
          isAuthenticated: true,
          isDesktop: false,
        }),
      ).toBe(false);
    });

    it('hides for providers and admins on public pages', () => {
      expect(
        shouldShowClientBottomNav({
          pathname: '/Explore',
          isAuthenticated: true,
          isDesktop: false,
          role: 'barber',
        }),
      ).toBe(false);
      expect(
        shouldShowProviderBottomNav({
          pathname: '/Explore',
          isAuthenticated: true,
          isDesktop: false,
          role: 'barber',
        }),
      ).toBe(true);
    });
  });

  describe('shouldHideGlobalNavOnMobile', () => {
    it('hides duplicate top nav for mobile clients on client/public zones', () => {
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/Dashboard',
          zone: APP_ZONES.CLIENT,
          isAuthenticated: true,
          isDesktop: false,
          role: 'client',
        }),
      ).toBe(true);
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/Explore',
          zone: APP_ZONES.PUBLIC,
          isAuthenticated: true,
          isDesktop: false,
          role: 'client',
        }),
      ).toBe(true);
    });

    it('keeps top nav for providers, desktop, guests, and booking flow', () => {
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/Dashboard',
          zone: APP_ZONES.CLIENT,
          isAuthenticated: true,
          isDesktop: true,
          role: 'client',
        }),
      ).toBe(false);
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/Explore',
          zone: APP_ZONES.PUBLIC,
          isAuthenticated: false,
          isDesktop: false,
          role: 'guest',
        }),
      ).toBe(false);
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/ProviderDashboard',
          zone: APP_ZONES.PROVIDER,
          isAuthenticated: true,
          isDesktop: false,
          role: 'barber',
        }),
      ).toBe(false);
      expect(
        shouldHideGlobalNavOnMobile({
          pathname: '/BookingFlow',
          zone: APP_ZONES.CLIENT,
          isAuthenticated: true,
          isDesktop: false,
          role: 'client',
        }),
      ).toBe(false);
    });
  });
});
