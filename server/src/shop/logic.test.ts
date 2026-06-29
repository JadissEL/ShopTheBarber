import { describe, it, expect } from 'vitest';
import { parseSkills, serializeSkills } from '../shop/logic';

describe('shop team logic', () => {
    it('parseSkills handles JSON array', () => {
        expect(parseSkills('["Fades","Beard"]')).toEqual(['Fades', 'Beard']);
    });

    it('parseSkills handles comma-separated fallback', () => {
        expect(parseSkills('Fades, Beard, Color')).toEqual(['Fades', 'Beard', 'Color']);
    });

    it('serializeSkills dedupes and trims', () => {
        expect(serializeSkills([' Fades ', 'Fades', 'Beard'])).toBe('["Fades","Beard"]');
    });
});
