import { describe, it, expect } from 'vitest';
import {
    calculateEarnedPoints,
    pointsToDollarValue,
    tierFromLifetimePoints,
    LOYALTY_CONFIG,
} from './config';

describe('loyalty config', () => {
    it('earns 1 point per dollar at Bronze tier', () => {
        expect(calculateEarnedPoints(45, 'Bronze')).toBe(45);
    });

    it('applies tier multiplier for Silver', () => {
        expect(calculateEarnedPoints(100, 'Silver')).toBe(110);
    });

    it('doubles marketplace earn', () => {
        expect(calculateEarnedPoints(50, 'Bronze', { marketplace: true })).toBe(100);
    });

    it('returns 0 below minimum spend', () => {
        expect(calculateEarnedPoints(4, 'Bronze')).toBe(0);
    });

    it('converts points to ~2% dollar value', () => {
        expect(pointsToDollarValue(100)).toBe(2);
        expect(pointsToDollarValue(50)).toBe(1);
    });

    it('assigns tiers from lifetime points', () => {
        expect(tierFromLifetimePoints(0)).toBe('Bronze');
        expect(tierFromLifetimePoints(500)).toBe('Silver');
        expect(tierFromLifetimePoints(1500)).toBe('Gold');
        expect(tierFromLifetimePoints(3500)).toBe('Platinum');
    });

    it('first $5 reward is reachable after ~2 visits', () => {
        const reward = LOYALTY_CONFIG.rewards.find((r) => r.id === 'discount_5');
        expect(reward?.points_cost).toBe(50);
        const twoVisits = calculateEarnedPoints(25, 'Bronze') * 2;
        expect(twoVisits).toBeGreaterThanOrEqual(50);
    });
});
