import { describe, it, expect } from 'vitest';
import { CAPABILITY_KEYS, hasCapability, hasAnyCapability, capabilityContextFromUser } from './capabilities';

describe('capabilities', () => {
    it('grants booking provider tools to solo barber and shop only', () => {
        expect(hasCapability(capabilityContextFromUser({ accountType: 'solo_barber' }), 'booking.provider.tools')).toBe(true);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'shop' }), 'booking.provider.tools')).toBe(true);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'seller' }), 'booking.provider.tools')).toBe(false);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'client' }), 'booking.provider.tools')).toBe(false);
    });

    it('grants service.write to booking providers only', () => {
        expect(hasCapability(capabilityContextFromUser({ accountType: 'solo_barber' }), 'service.write')).toBe(true);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'seller' }), 'service.write')).toBe(false);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'blogger' }), 'service.write')).toBe(false);
    });

    it('grants product.write to marketplace sellers and company when commerce active', () => {
        expect(hasCapability(capabilityContextFromUser({ accountType: 'seller' }), 'product.write')).toBe(true);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'blogger' }), 'product.write')).toBe(true);
        expect(hasCapability(capabilityContextFromUser({ accountType: 'company' }), 'product.write')).toBe(false);
        expect(
            hasCapability(
                capabilityContextFromUser({ accountType: 'company', companyCommerceEnabled: true }),
                'product.write',
            ),
        ).toBe(true);
    });

    it('supports OR checks via hasAnyCapability', () => {
        const ctx = capabilityContextFromUser({ accountType: 'blogger' });
        expect(hasAnyCapability(ctx, ['service.write', 'article.write'])).toBe(true);
        expect(hasAnyCapability(ctx, ['service.write', 'booking.provider.tools'])).toBe(false);
    });

    it('admins bypass all capabilities', () => {
        const ctx = capabilityContextFromUser({ role: 'admin', accountType: 'client' });
        expect(hasCapability(ctx, 'service.write')).toBe(true);
        expect(hasCapability(ctx, 'product.write')).toBe(true);
    });
});

describe('CAPABILITY_KEYS registry', () => {
    it('contains expected Phase 1 keys', () => {
        expect(CAPABILITY_KEYS).toContain('service.write');
        expect(CAPABILITY_KEYS).toContain('product.write');
        expect(CAPABILITY_KEYS).toContain('company.commerce');
        expect(CAPABILITY_KEYS.length).toBe(20);
    });
});
