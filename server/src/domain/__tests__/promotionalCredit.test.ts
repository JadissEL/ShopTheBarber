import { describe, expect, it } from 'vitest';
import { applyPromotionalCredit, normalizeWalletBuckets } from '../wallet/credits';

describe('grantPromotionalCredit buckets', () => {
    it('increases promotional balance without touching purchased', () => {
        const start = normalizeWalletBuckets({
            balance: 25,
            promotional_balance: 5,
            purchased_balance: 20,
        });
        const next = applyPromotionalCredit(start, 10);
        expect(next.promotional_balance).toBe(15);
        expect(next.purchased_balance).toBe(20);
        expect(next.balance).toBe(35);
    });
});
