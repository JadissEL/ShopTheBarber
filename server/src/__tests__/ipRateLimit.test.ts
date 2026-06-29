import { describe, it, expect, beforeEach } from 'vitest';
import {
    consumeIpRateLimit,
    __resetMemoryRateLimitStoreForTests,
    isUpstashConfigured,
} from '../lib/ipRateLimit';

describe('ipRateLimit (memory fallback)', () => {
    beforeEach(() => {
        __resetMemoryRateLimitStoreForTests();
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('allows requests under the limit', async () => {
        expect(isUpstashConfigured()).toBe(false);

        const first = await consumeIpRateLimit('test', '1.2.3.4', 3, 60_000);
        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);

        const second = await consumeIpRateLimit('test', '1.2.3.4', 3, 60_000);
        expect(second.allowed).toBe(true);
    });

    it('blocks when limit exceeded and returns retryAfterSeconds', async () => {
        for (let i = 0; i < 3; i++) {
            const ok = await consumeIpRateLimit('burst', '10.0.0.1', 3, 60_000);
            expect(ok.allowed).toBe(true);
        }

        const blocked = await consumeIpRateLimit('burst', '10.0.0.1', 3, 60_000);
        expect(blocked.allowed).toBe(false);
        expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('isolates buckets and identifiers', async () => {
        await consumeIpRateLimit('a', 'ip-1', 1, 60_000);
        const sameBucket = await consumeIpRateLimit('a', 'ip-1', 1, 60_000);
        expect(sameBucket.allowed).toBe(false);

        const otherIp = await consumeIpRateLimit('a', 'ip-2', 1, 60_000);
        expect(otherIp.allowed).toBe(true);

        const otherBucket = await consumeIpRateLimit('b', 'ip-1', 1, 60_000);
        expect(otherBucket.allowed).toBe(true);
    });
});
