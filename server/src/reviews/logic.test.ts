import { describe, it, expect } from 'vitest';
import { listPublicReviews } from './logic';

describe('reviews logic', () => {
    it('listPublicReviews returns array shape', async () => {
        const reviews = await listPublicReviews({
            target_type: 'barber',
            target_id: 'nonexistent-barber-id',
            limit: 5,
        });
        expect(Array.isArray(reviews)).toBe(true);
    });
});
