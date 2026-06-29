import { describe, it, expect } from 'vitest';
import {
    computeMarketplaceVatAmount,
    getMarketplaceVatRate,
    marketplaceLegalConfig,
    requireSellerTermsAccepted,
    MARKETPLACE_SELLER_TERMS_VERSION,
} from '../marketplace/legalConfig';

describe('marketplace/legalConfig', () => {
    it('defaults VAT to 24%', () => {
        expect(getMarketplaceVatRate()).toBe(0.24);
    });

    it('computes VAT on subtotal + shipping', () => {
        expect(computeMarketplaceVatAmount(100, 0)).toBe(24);
        expect(computeMarketplaceVatAmount(100, 10)).toBe(26.4);
    });

    it('requires seller terms on submit', () => {
        expect(() => requireSellerTermsAccepted({})).toThrow(/Seller Terms/);
        expect(() =>
            requireSellerTermsAccepted({
                seller_terms_accepted: true,
                seller_terms_version: MARKETPLACE_SELLER_TERMS_VERSION,
            }),
        ).not.toThrow();
    });

    it('exposes public legal config', () => {
        const cfg = marketplaceLegalConfig();
        expect(cfg.seller_terms_version).toBe(MARKETPLACE_SELLER_TERMS_VERSION);
        expect(cfg.shipping_liability.seller).toMatch(/Seller/);
    });
});
