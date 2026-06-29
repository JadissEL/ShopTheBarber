import { describe, it, expect } from 'vitest';
import {
  computeMarketplaceShipping,
  computeMarketplaceTax,
  MARKETPLACE_VAT_RATE_DEFAULT,
  MARKETPLACE_SELLER_TERMS_VERSION,
} from '@/lib/marketplaceLegal';

describe('marketplaceLegal', () => {
  it('computes free shipping above threshold', () => {
    expect(computeMarketplaceShipping(60)).toBe(0);
    expect(computeMarketplaceShipping(30)).toBeGreaterThan(0);
  });

  it('computes VAT at default Greece rate', () => {
    const tax = computeMarketplaceTax(100, 0, MARKETPLACE_VAT_RATE_DEFAULT);
    expect(tax).toBe(24);
  });

  it('exports stable seller terms version', () => {
    expect(MARKETPLACE_SELLER_TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
