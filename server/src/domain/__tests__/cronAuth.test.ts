import { describe, expect, it } from 'vitest';
import { verifyCronSecret, AUTO_CONFIRM_HOURS } from '../../lib/cronAuth';

describe('cronAuth', () => {
    it('AUTO_CONFIRM_HOURS is 2', () => {
        expect(AUTO_CONFIRM_HOURS).toBe(2);
    });

    it('verifyCronSecret rejects missing secret in production', () => {
        const prev = process.env.CRON_SECRET;
        const prevNode = process.env.NODE_ENV;
        process.env.CRON_SECRET = 'secret123';
        process.env.NODE_ENV = 'production';
        expect(verifyCronSecret({ headers: {} })).toBe(false);
        expect(verifyCronSecret({ headers: { 'x-cron-secret': 'secret123' } })).toBe(true);
        process.env.CRON_SECRET = prev;
        process.env.NODE_ENV = prevNode;
    });
});
