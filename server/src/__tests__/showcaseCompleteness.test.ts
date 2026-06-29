import { describe, it, expect } from 'vitest';
import {
    computeBarberShowcaseCompleteness,
    computeShopShowcaseCompleteness,
} from '../providerShowcase/completeness';

describe('showcase completeness', () => {
    it('scores empty barber profile at 0%', () => {
        const result = computeBarberShowcaseCompleteness({});
        expect(result.percent).toBe(0);
        expect(result.is_discoverable).toBe(false);
        expect(result.items).toHaveLength(5);
    });

    it('marks barber discoverable with bio + portfolio', () => {
        const result = computeBarberShowcaseCompleteness({
            bio: 'Fade specialist',
            portfolio: [{}, {}, {}],
        });
        expect(result.is_discoverable).toBe(true);
        expect(result.percent).toBeGreaterThanOrEqual(40);
    });

    it('marks barber discoverable with bio + highlights + timeline', () => {
        const result = computeBarberShowcaseCompleteness({
            bio: 'Hello',
            profile_highlights: ['Fades', 'Kids'],
            career_entries: [{ id: '1' }],
        });
        expect(result.is_discoverable).toBe(true);
    });

    it('scores shop completeness', () => {
        const result = computeShopShowcaseCompleteness({
            description: 'Premium shop',
            profile_highlights: ['Walk-ins', 'Luxury'],
        });
        expect(result.is_discoverable).toBe(true);
        expect(result.percent).toBe(50);
    });
});
