import { describe, it, expect } from 'vitest';
import { filterNavItemsByCapabilities, capabilityContextFromAuth } from '@/lib/navCapabilities';
import { SELLER_NAV, COMPANY_NAV } from '@/lib/accountTypeNav';

describe('navCapabilities', () => {
  it('filters seller nav by capabilities', () => {
    const ctx = capabilityContextFromAuth({ role: 'seller', accountType: 'seller' });
    const items = filterNavItemsByCapabilities(SELLER_NAV, ctx);
    const pages = items.map((i) => i.page);
    expect(pages).toContain('SellerDashboard');
    expect(pages).toContain('ProviderMarketplaceProducts');
    expect(pages).toContain('SellerOrders');
    expect(pages).toContain('SellerSettings');
    expect(pages).not.toContain('ProviderSettings');
  });

  it('hides company products when commerce is inactive', () => {
    const ctx = capabilityContextFromAuth({
      role: 'company',
      accountType: 'company',
      companyCommerceEnabled: false,
    });
    const items = filterNavItemsByCapabilities(COMPANY_NAV, ctx);
    expect(items.some((i) => i.page === 'ProviderMarketplaceProducts')).toBe(false);
  });

  it('shows company products when commerce is active', () => {
    const ctx = capabilityContextFromAuth({
      role: 'company',
      accountType: 'company',
      companyCommerceEnabled: true,
    });
    const items = filterNavItemsByCapabilities(COMPANY_NAV, ctx);
    expect(items.some((i) => i.page === 'ProviderMarketplaceProducts')).toBe(true);
  });
});
