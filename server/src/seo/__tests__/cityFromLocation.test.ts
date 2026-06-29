import { describe, expect, it } from 'vitest';
import { inferSeoCityName, primaryCityFromLocation } from '../cityFromLocation';

describe('cityFromLocation', () => {
    it('infers curated SEO cities from location text', () => {
        expect(inferSeoCityName('Paris, Le Marais')).toBe('Paris');
        expect(inferSeoCityName('London, Shoreditch')).toBe('London');
        expect(inferSeoCityName('Manhattan, NYC')).toBe('New York');
    });

    it('prefers existing city over inference', () => {
        expect(primaryCityFromLocation('Paris, Le Marais', 'Lyon')).toBe('Lyon');
    });

    it('falls back to first location segment', () => {
        expect(primaryCityFromLocation('Thessaloniki, Aristotelous', null)).toBe('Thessaloniki');
    });
});
