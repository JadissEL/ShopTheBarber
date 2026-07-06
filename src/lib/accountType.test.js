import { describe, it, expect } from 'vitest';
import {
  isAccountType,
  dashboardPageForAccountType,
  platformRoleForAccountType,
  isBookingProviderAccountType,
  buildChooseAccountTypeUrl,
  accountTypeFromLegacySignupType,
} from '@/lib/accountType';

describe('accountType', () => {
  it('validates account types', () => {
    expect(isAccountType('client')).toBe(true);
    expect(isAccountType('solo_barber')).toBe(true);
    expect(isAccountType('invalid')).toBe(false);
  });

  it('maps account types to dashboard pages', () => {
    expect(dashboardPageForAccountType('client')).toBe('Dashboard');
    expect(dashboardPageForAccountType('solo_barber')).toBe('ProviderDashboard');
    expect(dashboardPageForAccountType('seller')).toBe('SellerDashboard');
    expect(dashboardPageForAccountType('company')).toBe('CompanyDashboard');
    expect(dashboardPageForAccountType('blogger')).toBe('BloggerDashboard');
  });

  it('maps account types to platform roles', () => {
    expect(platformRoleForAccountType('solo_barber')).toBe('barber');
    expect(platformRoleForAccountType('shop')).toBe('shop_owner');
    expect(platformRoleForAccountType('seller')).toBe('seller');
  });

  it('identifies booking providers', () => {
    expect(isBookingProviderAccountType('solo_barber')).toBe(true);
    expect(isBookingProviderAccountType('seller')).toBe(false);
  });

  it('builds choose-account-type URLs', () => {
    expect(buildChooseAccountTypeUrl('seller')).toBe('/chooseaccounttype?accountType=seller');
    expect(buildChooseAccountTypeUrl('blogger', { redirect: '/BlogArticleEditor' })).toBe(
      '/chooseaccounttype?accountType=blogger&redirect=%2FBlogArticleEditor',
    );
  });

  it('maps legacy signup types', () => {
    expect(accountTypeFromLegacySignupType('barber')).toBe('solo_barber');
    expect(accountTypeFromLegacySignupType('shop')).toBe('shop');
    expect(accountTypeFromLegacySignupType('client')).toBe(null);
  });
});
