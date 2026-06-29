import { describe, it, expect } from 'vitest';
import { parseHighlights, formatMemberSince } from '../logic';

describe('providerShowcase', () => {
    it('parses JSON highlight arrays', () => {
        expect(parseHighlights('["Hot towel","Kids welcome"]')).toEqual(['Hot towel', 'Kids welcome']);
    });

    it('parses comma-separated highlights fallback', () => {
        expect(parseHighlights('Fades, Beard, VIP')).toEqual(['Fades', 'Beard', 'VIP']);
    });

    it('formats member since from ISO date', () => {
        const label = formatMemberSince('2024-03-15T10:00:00.000Z');
        expect(label).toMatch(/2024/);
    });
});
