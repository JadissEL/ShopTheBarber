import { describe, it, expect } from 'vitest';
import {
    canListProducts,
    authorCanSubmit,
    normalizeCategory,
    validateDraftPayload,
    validateSubmitReady,
} from '../marketplace/logic';

describe('marketplace/logic', () => {
    it('canListProducts allows barber, shop_owner, admin', () => {
        expect(canListProducts('barber')).toBe(true);
        expect(canListProducts('shop_owner')).toBe(true);
        expect(canListProducts('admin')).toBe(true);
        expect(canListProducts('client')).toBe(false);
    });

    it('validateDraftPayload validates price and name', () => {
        expect(() => validateDraftPayload({ name: 'A', price: -1 })).toThrow();
        const ok = validateDraftPayload({ name: 'Beard Oil', price: 29.99, stock: 5 });
        expect(ok.name).toBe('Beard Oil');
        expect(ok.price).toBe(29.99);
    });

    it('normalizeCategory accepts known categories', () => {
        expect(normalizeCategory('hair')).toBe('hair');
        expect(() => normalizeCategory('invalid')).toThrow();
    });

    it('validateSubmitReady requires description, category, stock', () => {
        expect(() =>
            validateSubmitReady({
                name: 'Product',
                description: 'Too short',
                price: 10,
                category: 'hair',
                stock: 0,
            })
        ).toThrow(/Description must be at least/);

        expect(() =>
            validateSubmitReady({
                name: 'Product',
                description: 'A'.repeat(25),
                price: 10,
                category: 'hair',
                stock: 5,
            })
        ).not.toThrow();
    });

    it('authorCanSubmit only draft and rejected', () => {
        expect(authorCanSubmit('draft')).toBe(true);
        expect(authorCanSubmit('published')).toBe(false);
    });
});
