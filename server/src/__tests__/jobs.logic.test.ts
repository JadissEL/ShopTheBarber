import { describe, it, expect } from 'vitest';
import {
    authorCanClose,
    authorCanEdit,
    authorCanSubmit,
    canPostJobs,
    isPublicJob,
    validateCategory,
    validateDraftPayload,
    validateSubmitReady,
} from '../jobs/logic';

describe('jobs logic', () => {
    it('canPostJobs allows provider roles only', () => {
        expect(canPostJobs('barber')).toBe(true);
        expect(canPostJobs('shop_owner')).toBe(true);
        expect(canPostJobs('provider')).toBe(true);
        expect(canPostJobs('admin')).toBe(false);
        expect(canPostJobs('client')).toBe(false);
    });

    it('authorCanEdit only draft and rejected', () => {
        expect(authorCanEdit('draft')).toBe(true);
        expect(authorCanEdit('rejected')).toBe(true);
        expect(authorCanEdit('pending_review')).toBe(false);
        expect(authorCanEdit('published')).toBe(false);
    });

    it('authorCanSubmit matches edit rules', () => {
        expect(authorCanSubmit('draft')).toBe(true);
        expect(authorCanSubmit('pending_review')).toBe(false);
    });

    it('authorCanClose only published', () => {
        expect(authorCanClose('published')).toBe(true);
        expect(authorCanClose('draft')).toBe(false);
    });

    it('isPublicJob requires published status and flag', () => {
        expect(isPublicJob({ status: 'published', published: true })).toBe(true);
        expect(isPublicJob({ status: 'published', published: false })).toBe(false);
        expect(isPublicJob({ status: 'pending_review', published: false })).toBe(false);
    });

    it('validateCategory rejects unknown categories', () => {
        expect(() => validateCategory('invalid')).toThrow(/Invalid category/);
        expect(validateCategory('grooming')).toBe('grooming');
    });

    it('validateSubmitReady enforces minimum description', () => {
        expect(() =>
            validateSubmitReady({
                title: 'Senior Barber',
                category: 'grooming',
                description: 'Too short',
                employer_type: 'shop',
                shop_id: 's1',
                employment_type: 'full_time',
                location_type: 'on_site',
            })
        ).toThrow(/at least/);

        expect(() =>
            validateSubmitReady({
                title: 'Senior Barber',
                category: 'grooming',
                description: 'A'.repeat(40),
                employer_type: 'shop',
                shop_id: 's1',
                employment_type: 'full_time',
                location_type: 'on_site',
            })
        ).not.toThrow();
    });

    it('validateDraftPayload trims title', () => {
        const data = validateDraftPayload({ title: '  Lead Stylist  ' });
        expect(data.title).toBe('Lead Stylist');
    });
});
