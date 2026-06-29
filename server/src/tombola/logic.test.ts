import { describe, it, expect } from 'vitest';
import { getWeekBounds } from './logic';

describe('tombola getWeekBounds', () => {
    it('returns monday start and sunday draw', () => {
        const wed = new Date('2026-06-24T12:00:00.000Z');
        const { weekStart, weekEnd, drawAt } = getWeekBounds(wed);
        expect(new Date(weekStart).getUTCDay()).toBe(1);
        expect(new Date(weekEnd).getUTCDay()).toBe(0);
        expect(new Date(drawAt).getUTCDay()).toBe(0);
        expect(new Date(drawAt).getUTCHours()).toBe(20);
    });
});
