import { describe, expect, it } from 'vitest';
import {
    applyCreditDeduction,
    applyPromotionalCredit,
    applyPurchasedTopUp,
    normalizeWalletBuckets,
} from '../wallet/credits';

describe('wallet credit buckets', () => {
    it('deducts promotional balance before purchased', () => {
        const buckets = { balance: 100, promotional_balance: 30, purchased_balance: 70 };
        const result = applyCreditDeduction(buckets, 40);
        expect(result.from_promotional).toBe(30);
        expect(result.from_purchased).toBe(10);
        expect(result.buckets.promotional_balance).toBe(0);
        expect(result.buckets.purchased_balance).toBe(60);
        expect(result.buckets.balance).toBe(60);
    });

    it('adds top-ups to purchased bucket', () => {
        const buckets = { balance: 50, promotional_balance: 20, purchased_balance: 30 };
        const next = applyPurchasedTopUp(buckets, 25);
        expect(next.purchased_balance).toBe(55);
        expect(next.promotional_balance).toBe(20);
        expect(next.balance).toBe(75);
    });

    it('adds promotional credits separately', () => {
        const buckets = { balance: 10, promotional_balance: 0, purchased_balance: 10 };
        const next = applyPromotionalCredit(buckets, 15);
        expect(next.promotional_balance).toBe(15);
        expect(next.purchased_balance).toBe(10);
        expect(next.balance).toBe(25);
    });

    it('migrates legacy balance into purchased when buckets empty', () => {
        const next = normalizeWalletBuckets({ balance: 42, promotional_balance: 0, purchased_balance: 0 });
        expect(next.purchased_balance).toBe(42);
        expect(next.balance).toBe(42);
    });
});
