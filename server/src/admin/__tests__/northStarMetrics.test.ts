import { describe, it, expect } from 'vitest';
import { hasBarberProfile, hasShopProfile } from '../northStarMetrics';
import { SHOP_SIZE_BANDS, PROVIDER_BENCHMARKS } from '../../provider/benchmarks';

describe('northStarMetrics helpers', () => {
    it('requires name plus bio or image for barber profile', () => {
        expect(hasBarberProfile({ name: 'Alex', bio: 'Fade specialist', image_url: null })).toBe(true);
        expect(hasBarberProfile({ name: 'Alex', bio: null, image_url: 'https://x/img.jpg' })).toBe(true);
        expect(hasBarberProfile({ name: 'Alex', bio: null, image_url: null })).toBe(false);
        expect(hasBarberProfile({ name: '', bio: 'Hi', image_url: null })).toBe(false);
    });

    it('requires name plus description or image for shop profile', () => {
        expect(hasShopProfile({ name: 'Studio', description: 'Downtown', image_url: null })).toBe(true);
        expect(hasShopProfile({ name: 'Studio', description: null, image_url: null })).toBe(false);
    });
});

describe('benchmark config', () => {
    it('defines shop size bands from solo to large', () => {
        expect(SHOP_SIZE_BANDS[0]?.key).toBe('solo');
        expect(SHOP_SIZE_BANDS.some((b) => b.key === 'large')).toBe(true);
    });

    it('defines provider benchmark thresholds', () => {
        expect(PROVIDER_BENCHMARKS.no_show_rate_pct.great).toBeLessThan(
            PROVIDER_BENCHMARKS.no_show_rate_pct.good
        );
        expect(PROVIDER_BENCHMARKS.rebooking_rate_pct.great).toBeGreaterThan(
            PROVIDER_BENCHMARKS.rebooking_rate_pct.good
        );
    });
});
