import { describe, it, expect } from 'vitest';
import {
    offersShopService,
    getServiceLocationModes,
    getShopBookingLocationModes,
    assertAtLeastOneServiceLocation,
    resolveVisitTypeForBarber,
} from '../serviceLocation';

describe('serviceLocation helpers', () => {
    it('defaults shop service to true when unset', () => {
        expect(offersShopService({})).toBe(true);
        expect(offersShopService({ offers_shop_service: null })).toBe(true);
    });

    it('detects mobile-only and shop-only modes', () => {
        expect(getServiceLocationModes({ offers_shop_service: false, offers_mobile_service: true })).toMatchObject({
            shop_only: false,
            mobile_only: true,
            both: false,
        });
        expect(getServiceLocationModes({ offers_shop_service: true, offers_mobile_service: false })).toMatchObject({
            shop_only: true,
            mobile_only: false,
            both: false,
        });
        expect(getServiceLocationModes({ offers_shop_service: true, offers_mobile_service: true })).toMatchObject({
            both: true,
        });
    });

    it('requires at least one service location', () => {
        expect(() => assertAtLeastOneServiceLocation(false, false)).toThrow(/at least one/i);
        expect(() => assertAtLeastOneServiceLocation(true, false)).not.toThrow();
        expect(() => assertAtLeastOneServiceLocation(false, true)).not.toThrow();
    });

    it('resolves visit type from barber capabilities', () => {
        expect(
            resolveVisitTypeForBarber({ offers_shop_service: false, offers_mobile_service: true }, undefined)
        ).toBe('mobile');
        expect(
            resolveVisitTypeForBarber({ offers_shop_service: true, offers_mobile_service: false }, undefined)
        ).toBe('shop');
        expect(
            resolveVisitTypeForBarber({ offers_shop_service: true, offers_mobile_service: true }, 'mobile')
        ).toBe('mobile');
        expect(() =>
            resolveVisitTypeForBarber({ offers_shop_service: false, offers_mobile_service: true }, 'shop')
        ).toThrow(/at-home/i);
        expect(() =>
            resolveVisitTypeForBarber({ offers_shop_service: true, offers_mobile_service: false }, 'mobile')
        ).toThrow(/at-home/i);
    });

    it('shop-only shop rejects at-home booking through shop context', () => {
        const modes = getShopBookingLocationModes(
            { offers_shop_service: true, offers_mobile_service: true },
            { offers_shop_service: true, offers_mobile_service: false }
        );
        expect(modes.shop_only).toBe(true);
        expect(modes.mobile).toBe(false);
    });
});
