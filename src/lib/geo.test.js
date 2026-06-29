import { describe, it, expect } from 'vitest';
import { distanceKm, roundKm, barberDistanceKm } from './geo';

describe('geo', () => {
    it('returns zero for identical coordinates', () => {
        expect(distanceKm(37.9838, 23.7275, 37.9838, 23.7275)).toBe(0);
    });

    it('computes Athens to Syntagma roughly', () => {
        const km = distanceKm(37.9838, 23.7275, 37.9755, 23.7348);
        expect(km).toBeGreaterThan(0.5);
        expect(km).toBeLessThan(3);
    });

    it('barberDistanceKm returns null without user coords', () => {
        expect(barberDistanceKm(null, { latitude: 1, longitude: 2 })).toBeNull();
    });

    it('roundKm rounds to two decimals', () => {
        expect(roundKm(1.23456)).toBe(1.23);
    });
});
