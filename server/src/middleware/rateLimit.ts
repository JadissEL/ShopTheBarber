import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db/prisma';
import { consumeIpRateLimit } from '../lib/ipRateLimit';

/**
 * Booking creation rate limits (see docs/RATE_LIMIT_SPECIFICATION.md):
 * - Max 5 bookings per user per hour
 * - Max 1 booking per user per barber per 30 minutes
 * - Max 3 booking attempts per second per IP (Upstash sliding window)
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

export async function enforceBookingRateLimit(context: RateLimitContext): Promise<RateLimitResult> {
    const { client_id, barber_id, ip_address } = context;

    if (!client_id || !barber_id) {
        throw new Error('client_id and barber_id required');
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const userBookingsLastHour = await prisma.bookings.findMany({
        where: {
            client_id,
            created_at: { gte: oneHourAgo.toISOString() },
        },
    });

    if (userBookingsLastHour.length >= 5) {
        return {
            status: 'RATE_LIMITED',
            reason: 'USER_BOOKING_QUOTA_EXCEEDED',
            message: 'You can only create 5 bookings per hour. Try again later.',
            retry_after_seconds: 3600,
        };
    }

    const recentBarberBookings = await prisma.bookings.findMany({
        where: {
            client_id,
            barber_id,
            created_at: { gte: thirtyMinutesAgo.toISOString() },
        },
    });

    if (recentBarberBookings.length > 0) {
        return {
            status: 'RATE_LIMITED',
            reason: 'DUPLICATE_BARBER_BOOKING',
            message: 'You already have a recent booking with this barber. Wait 30 minutes before booking again.',
            retry_after_seconds: 1800,
        };
    }

    if (ip_address) {
        const ipResult = await consumeIpRateLimit('booking:create', ip_address, 3, 1000);
        if (!ipResult.allowed) {
            return {
                status: 'RATE_LIMITED',
                reason: 'IP_RAPID_FIRE',
                message: 'Too many booking attempts. Please wait a moment.',
                retry_after_seconds: ipResult.retryAfterSeconds ?? 1,
            };
        }
    }

    return {
        status: 'ALLOWED',
        message: 'Rate limit check passed',
        user_bookings_this_hour: userBookingsLastHour.length,
        remaining_quota: 5 - userBookingsLastHour.length,
    };
}

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as { client_id?: string; barber_id?: string; client_email?: string } | undefined;
    const { client_id, barber_id, client_email } = body ?? {};
    const ip_address = request.ip;

    if (!client_id || !barber_id) {
        return;
    }

    const result = await enforceBookingRateLimit({
        client_id,
        barber_id,
        client_email: client_email || (request.user as { email?: string } | undefined)?.email || '',
        ip_address,
    });

    if (result.status === 'RATE_LIMITED') {
        if (result.retry_after_seconds) {
            reply.header('Retry-After', String(result.retry_after_seconds));
        }
        reply.status(429).send({
            error: result.message,
            reason: result.reason,
            retry_after: result.retry_after_seconds,
        });
    }
}
