import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findUnique } = vi.hoisted(() => ({
    findUnique: vi.fn(),
}));

vi.mock('../db/prisma', () => ({
    prisma: {
        company_accounts: {
            findUnique,
            update: vi.fn(),
        },
    },
}));

import { isCompanyCommerceEnabled } from './companyCommerce';

describe('companyCommerce', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.COMPANY_COMMERCE_USER_IDS;
    });

    it('returns false for non-company account types', async () => {
        expect(await isCompanyCommerceEnabled('u1', 'seller')).toBe(false);
        expect(findUnique).not.toHaveBeenCalled();
    });

    it('returns true when env allowlist matches', async () => {
        process.env.COMPANY_COMMERCE_USER_IDS = 'u1,u2';
        expect(await isCompanyCommerceEnabled('u1', 'company')).toBe(true);
        expect(findUnique).not.toHaveBeenCalled();
    });

    it('returns DB commerce_enabled flag for company users', async () => {
        findUnique.mockResolvedValue({ commerce_enabled: true });
        expect(await isCompanyCommerceEnabled('u1', 'company')).toBe(true);

        findUnique.mockResolvedValue({ commerce_enabled: false });
        expect(await isCompanyCommerceEnabled('u1', 'company')).toBe(false);
    });
});
