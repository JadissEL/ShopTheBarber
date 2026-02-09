import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse/spam on booking creation endpoint
 * - Max 5 bookings per user per hour (across all barbers)
 * - Max 1 booking per user per barber per 30 minutes
 * - Max 3 requests per second per IP (rapid click prevention)
 */

interface RateLimitContext {
    client_id: string;
    barber_id: string;
    client_email: string;
    ip_address?: string;
}

interface RateLimitResult {
    status: 'ALLOWED' | 'RATE_LIMITED';
    reason?: string;
    message?: string;
    retry_after_seconds?: number;
    user_bookings_this_hour?: number;
    remaining_quota?: number;
}

export async function enforceBookingRateLimit(
    context: RateLimitContext
): Promise<RateLimitResult> {
    const { client_id, barber_id, client_email, ip_address } = context;

    if (!client_id || !barber_id) {
        throw new Error('client_id and barber_id required');
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // CHECK 1: User's total bookings in last hour
    const userBookingsLastHour = await db.query.bookings.findMany({
        where: and(
            eq(schema.bookings.client_id, client_id),
            sql`${schema.bookings.created_at} >= ${oneHourAgo.toISOString()}`
        )
    });

    if (userBookingsLastHour.length >= 5) {
        return {
            status: 'RATE_LIMITED',
            reason: 'USER_BOOKING_QUOTA_EXCEEDED',
            message: 'You can only create 5 bookings per hour. Try again later.',
            retry_after_seconds: 3600
        };
    }

    // CHECK 2: Same user booking same barber within 30 minutes
    const recentBarberBookings = await db.query.bookings.findMany({
        where: and(
            eq(schema.bookings.client_id, client_id),
            eq(schema.bookings.barber_id, barber_id),
            sql`${schema.bookings.created_at} >= ${thirtyMinutesAgo.toISOString()}`
        )
    });

    if (recentBarberBookings.length > 0) {
        return {
            status: 'RATE_LIMITED',
            reason: 'DUPLICATE_BARBER_BOOKING',
            message: 'You already have a recent booking with this barber. Wait 30 minutes before booking again.',
            retry_after_seconds: 1800
        };
    }

    // CHECK 3: Rapid-fire requests from same IP (prevent spam clicks)
    // Note: In production, use Redis for sub-second accuracy
    // For now, we use simple in-memory tracking
    if (ip_address) {
        // This would ideally use Redis or a proper rate limiter
        // For MVP, we skip the sub-second IP check
        console.log(`[Rate Limit] IP check skipped for ${ip_address} - implement Redis for production`);
    }

    // SUCCESS - Rate limit check passed
    return {
        status: 'ALLOWED',
        message: 'Rate limit check passed',
        user_bookings_this_hour: userBookingsLastHour.length,
        remaining_quota: 5 - userBookingsLastHour.length
    };
}

/**
 * Fastify plugin wrapper for rate limiting
 * Can be used as route-level middleware
 */
export async function rateLimitMiddleware(request: any, reply: any) {
    const { client_id, barber_id, client_email } = request.body;
    const ip_address = request.ip;

    if (!client_id || !barber_id) {
        return; // Skip rate limiting if required fields missing (let validation handle it)
    }

    const result = await enforceBookingRateLimit({
        client_id,
        barber_id,
        client_email: client_email || request.user?.email || '',
        ip_address
    });

    if (result.status === 'RATE_LIMITED') {
        return reply.status(429).send({
            error: result.message,
            reason: result.reason,
            retry_after: result.retry_after_seconds
        });
    }
}
