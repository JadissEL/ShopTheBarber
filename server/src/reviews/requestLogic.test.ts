import { describe, it, expect } from 'vitest';
import { buildReviewPageUrl, reviewNudgeWindowStart } from './requestLogic';

describe('review request logic', () => {
    it('buildReviewPageUrl encodes token', () => {
        const url = buildReviewPageUrl('01234567890123456789012345678901');
        expect(url).toContain('/Review?token=');
        expect(url).toContain('01234567890123456789012345678901');
    });

    it('reviewNudgeWindowStart subtracts hours from now', () => {
        const now = new Date('2026-06-26T12:00:00.000Z');
        const start = reviewNudgeWindowStart(now, 24);
        expect(new Date(start).getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000);
    });
});
