import { describe, expect, it } from 'vitest';
import { slotIntervalOverlaps } from '../../logic/slotAvailability';

describe('slotIntervalOverlaps', () => {
    it('detects overlapping intervals', () => {
        const aStart = new Date('2026-06-28T10:00:00Z');
        const aEnd = new Date('2026-06-28T11:00:00Z');
        const bStart = new Date('2026-06-28T10:30:00Z');
        const bEnd = new Date('2026-06-28T11:30:00Z');
        expect(slotIntervalOverlaps(aStart, aEnd, bStart, bEnd)).toBe(true);
    });

    it('returns false for adjacent non-overlapping intervals', () => {
        const aStart = new Date('2026-06-28T10:00:00Z');
        const aEnd = new Date('2026-06-28T11:00:00Z');
        const bStart = new Date('2026-06-28T11:00:00Z');
        const bEnd = new Date('2026-06-28T12:00:00Z');
        expect(slotIntervalOverlaps(aStart, aEnd, bStart, bEnd)).toBe(false);
    });
});
