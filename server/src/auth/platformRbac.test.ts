import { describe, it, expect } from 'vitest';
import {
    isAdminRole,
    isProviderRole,
    isClientRole,
    canAccessProviderTools,
    isMarketplaceSellerRole,
    canPostJobs,
    canAuthorArticles,
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
        expect(isProviderRole('seller')).toBe(false);
    });

    it('recognizes marketplace seller roles', () => {
        expect(isMarketplaceSellerRole('seller')).toBe(true);
        expect(isMarketplaceSellerRole('company')).toBe(true);
        expect(isMarketplaceSellerRole('blogger')).toBe(true);
        expect(isMarketplaceSellerRole('client')).toBe(false);
    });

    it('recognizes employer and author capabilities', () => {
        expect(canPostJobs('company')).toBe(true);
        expect(canPostJobs('client')).toBe(false);
        expect(canAuthorArticles('blogger')).toBe(true);
        expect(canAuthorArticles('seller')).toBe(false);
    });

    it('recognizes client role', () => {
        expect(isClientRole('client')).toBe(true);
        expect(isClientRole(null)).toBe(true);
        expect(isClientRole('barber')).toBe(false);
    });
});
