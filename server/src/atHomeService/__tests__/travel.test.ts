import { describe, it, expect } from 'vitest';
import { distanceKm, roundKm } from '../distance';
import { matchTravelZone } from '../logic';

describe('atHomeService distance', () => {
    it('computes zero distance for identical coordinates', () => {
        expect(distanceKm(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
    });

    it('rounds kilometers to two decimals', () => {
        expect(roundKm(12.3456)).toBe(12.35);
    });

    it('returns plausible Paris–London distance', () => {
        const km = distanceKm(48.8566, 2.3522, 51.5074, -0.1278);
        expect(km).toBeGreaterThan(330);
        expect(km).toBeLessThan(360);
    });
});

describe('matchTravelZone', () => {
    const zones = [
        { label: '0–5 km', min_distance_km: 0, max_distance_km: 5, fee_amount: 0 },
        { label: '5–15 km', min_distance_km: 5, max_distance_km: 15, fee_amount: 10 },
        { label: '15–25 km', min_distance_km: 15, max_distance_km: 25, fee_amount: 20 },
    ];

    it('matches inner zone at boundary start', () => {
        expect(matchTravelZone(0, zones)).toEqual({ label: '0–5 km', fee: 0 });
    });

    it('matches middle zone', () => {
        expect(matchTravelZone(7.5, zones)).toEqual({ label: '5–15 km', fee: 10 });
    });

    it('matches outer zone at max boundary', () => {
        expect(matchTravelZone(25, zones)).toEqual({ label: '15–25 km', fee: 20 });
    });

    it('returns null when beyond all zones', () => {
        expect(matchTravelZone(30, zones)).toBeNull();
    });
});
