import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type IpRateLimitResult = {
    allowed: boolean;
    remaining?: number;
    retryAfterSeconds?: number;
};

type WindowUnit = 'ms' | 's' | 'm' | 'h' | 'd';

function windowToUpstashDuration(windowMs: number): `${number} ${WindowUnit}` {
    if (windowMs >= 86_400_000 && windowMs % 86_400_000 === 0) {
        return `${windowMs / 86_400_000} d`;
    }
    if (windowMs >= 3_600_000 && windowMs % 3_600_000 === 0) {
        return `${windowMs / 3_600_000} h`;
    }
    if (windowMs >= 60_000 && windowMs % 60_000 === 0) {
        return `${windowMs / 60_000} m`;
    }
    if (windowMs >= 1000 && windowMs % 1000 === 0) {
        return `${windowMs / 1000} s`;
    }
    return `${windowMs} ms`;
}

export function isUpstashConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisClient: Redis | null = null;
let warnedMemoryFallback = false;

function getRedis(): Redis {
    if (!redisClient) {
        redisClient = Redis.fromEnv();
    }
    return redisClient;
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
    const cacheKey = `${maxRequests}:${windowMs}`;
    let limiter = upstashLimiters.get(cacheKey);
    if (!limiter) {
        limiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(maxRequests, windowToUpstashDuration(windowMs)),
            prefix: 'stb:rl',
            analytics: true,
        });
        upstashLimiters.set(cacheKey, limiter);
    }
    return limiter;
}

/** Dev/test fallback when Upstash env vars are not set. */
class MemoryRateLimitStore {
    private buckets = new Map<string, { count: number; resetAt: number }>();

    consume(key: string, maxRequests: number, windowMs: number): IpRateLimitResult {
        const now = Date.now();
        const entry = this.buckets.get(key);

        if (!entry || now >= entry.resetAt) {
            this.buckets.set(key, { count: 1, resetAt: now + windowMs });
            return { allowed: true, remaining: maxRequests - 1 };
        }

        if (entry.count >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
            };
        }

        entry.count += 1;
        return { allowed: true, remaining: maxRequests - entry.count };
    }

    /** Test helper */
    clear(): void {
        this.buckets.clear();
    }
}

const memoryStore = new MemoryRateLimitStore();

function warnMemoryFallbackOnce(): void {
    if (warnedMemoryFallback) return;
    warnedMemoryFallback = true;
    const isProd = process.env.NODE_ENV === 'production';
    const msg =
        'Rate limiting: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set, using in-process store (not shared across instances).';
    if (isProd) {
        console.error(`FATAL: ${msg} Configure Upstash Redis for production.`);
    } else {
        console.warn(msg);
    }
}

/**
 * Sliding-window rate limit keyed by bucket + identifier (typically IP).
 * Uses Upstash Redis when configured; falls back to in-memory in dev/test only.
 */
export async function consumeIpRateLimit(
    bucket: string,
    identifier: string,
    maxRequests: number,
    windowMs: number
): Promise<IpRateLimitResult> {
    const key = `${bucket}:${identifier}`;

    if (isUpstashConfigured()) {
        const limiter = getUpstashLimiter(maxRequests, windowMs);
        const { success, remaining, reset } = await limiter.limit(key);
        if (success) {
            return { allowed: true, remaining: remaining ?? undefined };
        }
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    warnMemoryFallbackOnce();
    return memoryStore.consume(key, maxRequests, windowMs);
}

export async function isIpRateLimitAllowed(
    bucket: string,
    identifier: string,
    maxRequests: number,
    windowMs: number
): Promise<boolean> {
    const result = await consumeIpRateLimit(bucket, identifier, maxRequests, windowMs);
    return result.allowed;
}

/** @internal Vitest only */
export function __resetMemoryRateLimitStoreForTests(): void {
    memoryStore.clear();
    upstashLimiters.clear();
    warnedMemoryFallback = false;
}
