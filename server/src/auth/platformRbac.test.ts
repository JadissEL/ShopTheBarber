import { describe, it, expect } from 'vitest';
import {
    isAdminRole,
    isProviderRole,
    isClientRole,
    canAccessProviderTools,
} from './platformRbac';

describe('platformRbac', () => {
    it('separates admin from provider roles', () => {
        expect(isAdminRole('admin')).toBe(true);
        expect(isProviderRole('admin')).toBe(false);
        expect(canAccessProviderTools('admin')).toBe(false);
    });

    it('recognizes provider roles', () => {
        expect(isProviderRole('barber')).toBe(true);
        expect(isProviderRole('shop_owner')).toBe(true);
        expect(isProviderRole('provider')).toBe(true);
        expect(isProviderRole('client')).toBe(false);
    });

    it('recognizes client role', () => {
        expect(isClientRole('client')).toBe(true);
        expect(isClientRole(null)).toBe(true);
        expect(isClientRole('barber')).toBe(false);
    });
});
