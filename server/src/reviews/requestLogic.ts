import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { logger } from '../lib/logger';
import { sendEmail } from '../logic/email';
import { buildReviewRequestSms, sendSms } from '../logic/sms';
import { getBookingReviewStatus } from './logic';

export type ReviewRequestResult = {
    booking_id: string;
    token: string;
    notification: boolean;
    email: boolean;
    sms: boolean;
    skipped_reason?: string;
};

export type ReviewNudgeResult = {
    scanned: number;
    sent: number;
    skipped: number;
    failed: number;
    hours_after: number;
    schema_not_ready?: boolean;
};

function frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'https://shop-the-barber.vercel.app').replace(/\/$/, '');
}

export function buildReviewPageUrl(token: string): string {
    return `${frontendBaseUrl()}/Review?token=${encodeURIComponent(token)}`;
}

export function buildAuthenticatedReviewUrl(bookingId: string): string {
    return `${frontendBaseUrl()}/Review?bookingId=${encodeURIComponent(bookingId)}`;
}

export async function findBookingByReviewToken(token: string) {
    if (!token || token.length < 20) return null;
    return prisma.bookings.findFirst({
        where: { review_request_token: token, status: 'completed' },
        include: {
            barber: { select: { id: true, name: true, image_url: true } },
            shop: { select: { id: true, name: true } },
        },
    });
}

async function bookingNeedsReview(bookingId: string): Promise<boolean> {
    const reviews = await prisma.reviews.findMany({
        where: { booking_id: bookingId },
        select: { target_type: true },
    });
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: { shop_id: true },
    });
    if (!booking) return false;
    const hasBarber = reviews.some((r) => r.target_type === 'barber');
    const hasShop = reviews.some((r) => r.target_type === 'shop');
    if (!hasBarber) return true;
    if (booking.shop_id && !hasShop) return true;
    return false;
}

async function resolveRecipientContact(booking: {
    client_id: string | null;
    client_email: string | null;
    client_phone: string | null;
    client_name: string | null;
}) {
    if (booking.client_id) {
        const user = await prisma.users.findUnique({
            where: { id: booking.client_id },
            select: {
                id: true,
                email: true,
                phone: true,
                full_name: true,
                sms_reminders_enabled: true,
                email_reminders_enabled: true,
            },
        });
        if (user) {
            return {
                user_id: user.id,
                name: user.full_name || booking.client_name || 'there',
                email: user.email_reminders_enabled !== false ? user.email : null,
                phone: user.sms_reminders_enabled !== false ? user.phone : null,
            };
        }
    }
    return {
        user_id: null,
        name: booking.client_name || 'there',
        email: booking.client_email?.trim() || null,
        phone: booking.client_phone?.trim() || null,
    };
}

async function sendReviewChannels(params: {
    booking: {
        id: string;
        barber_name: string | null;
        service_name: string | null;
        date_text: string | null;
        time_text: string | null;
        client_id: string | null;
        client_email: string | null;
        client_phone: string | null;
        client_name: string | null;
    };
    token: string;
    barberDisplayName: string;
    isNudge: boolean;
}): Promise<{ notification: boolean; email: boolean; sms: boolean }> {
    const reviewUrl = buildReviewPageUrl(params.token);
    const authReviewUrl = buildAuthenticatedReviewUrl(params.booking.id);
    const recipient = await resolveRecipientContact(params.booking);

    let notification = false;
    let email = false;
    let sms = false;

    if (recipient.user_id) {
        try {
            await prisma.notifications.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: recipient.user_id,
                    title: params.isNudge ? 'How was your cut?' : 'Thanks for visiting, leave a review',
                    content: params.isNudge
                        ? `A quick star rating for ${params.barberDisplayName} helps other clients find great barbers. Open My Bookings to review.`
                        : `Share your experience with ${params.barberDisplayName}. Open My Bookings Review.`,
                    type: 'review_request',
                },
            });
            notification = true;
        } catch (err) {
            logger.warn('[reviews] notification failed', { bookingId: params.booking.id, err });
        }
    }

    const subject = params.isNudge
        ? `Quick rating for ${params.barberDisplayName}?`
        : `How was your visit with ${params.barberDisplayName}?`;

    if (recipient.email) {
        const emailResult = await sendEmail({
            to: recipient.email,
            subject,
            template: params.isNudge ? 'review_nudge' : 'review_request',
            data: {
                clientName: recipient.name,
                barberName: params.barberDisplayName,
                serviceName: params.booking.service_name || 'Grooming appointment',
                date: params.booking.date_text || 'Recent visit',
                time: params.booking.time_text || '',
                reviewUrl: recipient.user_id ? authReviewUrl : reviewUrl,
            },
        });
        email = emailResult.success && !emailResult.mocked;
    }

    if (recipient.phone) {
        const smsResult = await sendSms(
            recipient.phone,
            buildReviewRequestSms({
                barberName: params.barberDisplayName,
                reviewUrl,
                isNudge: params.isNudge,
            })
        );
        sms = smsResult.success && !smsResult.mocked;
    }

    return { notification, email, sms };
}

/** Idempotent: fires when a booking first transitions to completed. */
export async function triggerReviewRequestOnCompletion(bookingId: string): Promise<ReviewRequestResult | null> {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: { barber: { select: { name: true } } },
    });
    if (!booking || booking.status !== 'completed') return null;

    const needsReview = await bookingNeedsReview(bookingId);
    if (!needsReview) {
        return {
            booking_id: bookingId,
            token: booking.review_request_token || '',
            notification: false,
            email: false,
            sms: false,
            skipped_reason: 'already_reviewed',
        };
    }

    if (booking.review_request_sent_at) {
        return {
            booking_id: bookingId,
            token: booking.review_request_token || '',
            notification: false,
            email: false,
            sms: false,
            skipped_reason: 'already_sent',
        };
    }

    const token = booking.review_request_token || crypto.randomUUID();
    const barberDisplayName = booking.barber_name || booking.barber?.name || 'your barber';
    const now = new Date().toISOString();

    const channels = await sendReviewChannels({
        booking,
        token,
        barberDisplayName,
        isNudge: false,
    });

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            review_request_token: token,
            review_request_sent_at: now,
            updated_at: now,
        },
    });

    return {
        booking_id: bookingId,
        token,
        ...channels,
    };
}

export async function getReviewRequestByToken(token: string) {
    const booking = await findBookingByReviewToken(token);
    if (!booking) throw new Error('Review link not found or expired');

    const reviews = await prisma.reviews.findMany({
        where: { booking_id: booking.id },
        select: { id: true, target_type: true, rating: true, created_at: true },
    });
    const barberReview = reviews.find((r) => r.target_type === 'barber') ?? null;
    const shopReview = reviews.find((r) => r.target_type === 'shop') ?? null;

    return {
        booking_id: booking.id,
        barber_id: booking.barber_id,
        shop_id: booking.shop_id,
        barber_name: booking.barber_name || booking.barber?.name || null,
        shop_name: booking.shop?.name ?? null,
        service_name: booking.service_name,
        date_text: booking.date_text,
        time_text: booking.time_text,
        client_name: booking.client_name,
        can_review: true,
        shop_available: !!booking.shop_id,
        requires_sign_in: !!booking.client_id,
        barber: { submitted: !!barberReview, review: barberReview },
        shop: { submitted: !!shopReview, review: shopReview, available: !!booking.shop_id },
        all_done: !!barberReview && (!booking.shop_id || !!shopReview),
    };
}

export async function listPendingReviewsForUser(userId: string, limit = 5) {
    const bookings = await prisma.bookings.findMany({
        where: { client_id: userId, status: 'completed' },
        orderBy: { updated_at: 'desc' },
        take: Math.min(limit, 20),
        select: {
            id: true,
            barber_name: true,
            service_name: true,
            date_text: true,
        },
    });

    const pending: Array<{
        booking_id: string;
        barber_name: string | null;
        service_name: string | null;
        date_text: string | null;
    }> = [];

    for (const b of bookings) {
        const status = await getBookingReviewStatus(b.id, userId);
        if (!status.all_done) {
            pending.push({
                booking_id: b.id,
                barber_name: b.barber_name,
                service_name: b.service_name,
                date_text: b.date_text,
            });
        }
    }
    return pending;
}

export function reviewNudgeWindowStart(now: Date, hoursAfter: number): string {
    const ms = now.getTime() - hoursAfter * 60 * 60 * 1000;
    return new Date(ms).toISOString();
}

export async function processReviewNudges(options?: {
    now?: Date;
    hoursAfter?: number;
}): Promise<ReviewNudgeResult> {
    const now = options?.now ?? new Date();
    const hoursAfter =
        options?.hoursAfter ??
        (parseFloat(process.env.REVIEW_NUDGE_HOURS_AFTER || '24') || 24);
    const cutoffIso = reviewNudgeWindowStart(now, hoursAfter);

    let bookings: Array<{
        id: string;
        barber_name: string | null;
        service_name: string | null;
        date_text: string | null;
        time_text: string | null;
        client_id: string | null;
        client_email: string | null;
        client_phone: string | null;
        client_name: string | null;
        review_request_token: string | null;
        barber_id: string;
    }>;

    try {
        bookings = await prisma.bookings.findMany({
            where: {
                status: 'completed',
                review_request_sent_at: { not: null, lte: cutoffIso },
                review_nudge_sent_at: null,
                review_request_token: { not: null },
            },
            take: 100,
            select: {
                id: true,
                barber_id: true,
                barber_name: true,
                service_name: true,
                date_text: true,
                time_text: true,
                client_id: true,
                client_email: true,
                client_phone: true,
                client_name: true,
                review_request_token: true,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
            return { scanned: 0, sent: 0, skipped: 0, failed: 0, hours_after: hoursAfter, schema_not_ready: true };
        }
        throw err;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings) {
        if (!booking.review_request_token) {
            skipped += 1;
            continue;
        }

        const needsReview = await bookingNeedsReview(booking.id);
        if (!needsReview) {
            await prisma.bookings.update({
                where: { id: booking.id },
                data: { review_nudge_sent_at: new Date().toISOString() },
            });
            skipped += 1;
            continue;
        }

        const barberRow = await prisma.barbers.findUnique({
            where: { id: booking.barber_id },
            select: { name: true },
        });
        const barberDisplayName = booking.barber_name || barberRow?.name || 'your barber';

        try {
            const channels = await sendReviewChannels({
                booking,
                token: booking.review_request_token,
                barberDisplayName,
                isNudge: true,
            });

            if (channels.notification || channels.email || channels.sms) {
                await prisma.bookings.update({
                    where: { id: booking.id },
                    data: { review_nudge_sent_at: new Date().toISOString() },
                });
                sent += 1;
            } else {
                skipped += 1;
            }
        } catch {
            failed += 1;
        }
    }

    return { scanned: bookings.length, sent, skipped, failed, hours_after: hoursAfter };
}

/** Call when status changes to completed (entity API, capture flow, etc.). */
export async function maybeTriggerReviewRequestOnCompletion(
    bookingId: string,
    previousStatus: string | null | undefined,
    newStatus: string | null | undefined
): Promise<void> {
    if (newStatus !== 'completed' || previousStatus === 'completed') return;
    await triggerReviewRequestOnCompletion(bookingId).catch((err) => {
        logger.warn('[reviews] completion trigger failed', { bookingId, err });
    });
}
