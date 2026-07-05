import { describe, it, expect } from 'vitest';
import {
    barberServicesMatchExploreFilter,
    normalizeExploreFilterTag,
    serviceTextMatchesExploreFilter,
} from './serviceTags';
import { parseExploreShopQuery } from './logic';

describe('explore serviceTags (server)', () => {
    it('matches executive grooming to haircut filter', () => {
        expect(serviceTextMatchesExploreFilter('', 'The Executive Grooming', 'Haircut')).toBe(true);
    });

    it('normalizes beard trim tag', () => {
        expect(normalizeExploreFilterTag('Beard Trim')).toBe('beard');
    });

    it('matches barber service strings via synonyms', () => {
        expect(barberServicesMatchExploreFilter(['Executive cut & finish'], 'Haircut')).toBe(true);
    });
});

describe('explore shop query parser', () => {
    it('parses shop search flags', () => {
        expect(parseExploreShopQuery({ q: 'downtown', city: 'Brussels', kids: '1', language: 'en' })).toEqual({
            q: 'downtown',
            city: 'Brussels',
            language: 'en',
            kids: true,
            limit: undefined,
            offset: undefined,
        });
    });
});
