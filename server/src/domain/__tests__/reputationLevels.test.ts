import { describe, expect, it } from 'vitest';
import { levelFromScore, nextLevelProgress } from '../reputation/levels';

describe('reputation levels', () => {
    it('maps score to tier', () => {
        expect(levelFromScore(0)).toBe('new');
        expect(levelFromScore(50)).toBe('bronze');
        expect(levelFromScore(500)).toBe('gold');
        expect(levelFromScore(5000)).toBe('legend');
    });

    it('computes progress to next tier', () => {
        const p = nextLevelProgress(125);
        expect(p.current).toBe('bronze');
        expect(p.next).toBe('silver');
        expect(p.progressPct).toBeGreaterThan(0);
    });
});
