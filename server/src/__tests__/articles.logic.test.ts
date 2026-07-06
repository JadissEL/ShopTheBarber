import { describe, it, expect } from 'vitest';
import {
    canAuthorArticles,
    authorCanEdit,
    authorCanSubmit,
    slugify,
    validateDraftPayload,
    validateSubmitReady,
} from '../articles/logic';

describe('articles/logic', () => {
    it('canAuthorArticles allows author roles', () => {
        expect(canAuthorArticles('barber')).toBe(true);
        expect(canAuthorArticles('shop_owner')).toBe(true);
        expect(canAuthorArticles('provider')).toBe(true);
        expect(canAuthorArticles('blogger')).toBe(true);
        expect(canAuthorArticles('admin')).toBe(false);
        expect(canAuthorArticles('client')).toBe(false);
        expect(canAuthorArticles('seller')).toBe(false);
        expect(canAuthorArticles(null, 'blogger')).toBe(true);
    });

    it('authorCanEdit and authorCanSubmit match draft/rejected', () => {
        expect(authorCanEdit('draft')).toBe(true);
        expect(authorCanEdit('rejected')).toBe(true);
        expect(authorCanEdit('pending_review')).toBe(false);
        expect(authorCanSubmit('draft')).toBe(true);
        expect(authorCanSubmit('published')).toBe(false);
    });

    it('slugify normalizes titles', () => {
        expect(slugify('Hello World!')).toBe('hello-world');
    });

    it('validateDraftPayload rejects short titles', () => {
        expect(() => validateDraftPayload({ title: 'ab' })).toThrow(/Title must be/);
    });

    it('validateSubmitReady requires excerpt, category, and content length', () => {
        expect(() =>
            validateSubmitReady({
                title: 'Valid title',
                content: 'short',
                excerpt: '',
                category: null,
            })
        ).toThrow(/body must be at least/);

        expect(() =>
            validateSubmitReady({
                title: 'Valid title',
                content: 'x'.repeat(120),
                excerpt: 'Summary',
                category: 'tips',
            })
        ).not.toThrow();
    });
});
