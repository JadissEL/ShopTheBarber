import { describe, it, expect } from 'vitest';
import { parseScopesPayload, partnerHasScope } from '../auth';

describe('partner auth', () => {
    it('parses legacy array scopes_json', () => {
        expect(parseScopesPayload(JSON.stringify(['bookings:read']))).toEqual({
            scopes: ['bookings:read'],
        });
    });

    it('parses object scopes with shop_id', () => {
        expect(
            parseScopesPayload(JSON.stringify({ scopes: ['bookings:read'], shop_id: 'shop-1' }))
        ).toEqual({
            scopes: ['bookings:read'],
            shop_id: 'shop-1',
        });
    });

    it('wildcard scope grants any permission', () => {
        expect(partnerHasScope(['*'], 'bookings:read')).toBe(true);
        expect(partnerHasScope(['bookings:read'], 'finance:view')).toBe(false);
    });
});

describe('shop RBAC', () => {
    it('receptionist can check in but not manage finance', async () => {
        const { roleHasPermission } = await import('../../auth/shopRbac');
        expect(roleHasPermission('receptionist', 'bookings:check_in')).toBe(true);
        expect(roleHasPermission('receptionist', 'finance:manage')).toBe(false);
    });

    it('manager can export reports', async () => {
        const { roleHasPermission } = await import('../../auth/shopRbac');
        expect(roleHasPermission('manager', 'reports:export')).toBe(true);
    });
});
