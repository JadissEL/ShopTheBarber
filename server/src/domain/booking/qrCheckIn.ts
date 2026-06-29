import crypto from 'crypto';
import { prisma } from '../../db/prisma';

const QR_PREFIX = 'stb-ci-';

export function generateQrCheckInToken(): string {
    return `${QR_PREFIX}${crypto.randomBytes(16).toString('hex')}`;
}

export async function ensureBookingQrToken(bookingId: string): Promise<string> {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: { qr_check_in_token: true, status: true },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.qr_check_in_token) return booking.qr_check_in_token;

    const token = generateQrCheckInToken();
    await prisma.bookings.update({
        where: { id: bookingId },
        data: { qr_check_in_token: token },
    });
    return token;
}

export async function recordBarberCheckIn(params: {
    bookingId: string;
    barberUserId: string;
    qrToken?: string;
    latitude?: number;
    longitude?: number;
}) {
    const booking = await prisma.bookings.findUnique({
        where: { id: params.bookingId },
        include: { barber: { select: { user_id: true } }, check_in: true },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.barber?.user_id !== params.barberUserId) {
        throw new Error('Only the assigned barber can check in this booking');
    }
    if (['cancelled', 'no_show'].includes(booking.status || '')) {
        throw new Error('Cannot check in a cancelled booking');
    }

    if (booking.qr_check_in_token) {
        if (!params.qrToken || params.qrToken !== booking.qr_check_in_token) {
            throw new Error('Invalid check-in QR code — scan the client\'s code');
        }
    } else if (!params.qrToken) {
        throw new Error('Check-in QR code is required');
    }

    const token = params.qrToken ?? booking.qr_check_in_token;
    if (!token) {
        throw new Error('Check-in QR code is required');
    }

    if (booking.check_in?.scanned_at) {
        return { already_checked_in: true, check_in: booking.check_in };
    }

    const now = new Date().toISOString();
    const qrToken = booking.qr_check_in_token ?? token;

    if (!booking.qr_check_in_token) {
        await prisma.bookings.update({
            where: { id: params.bookingId },
            data: { qr_check_in_token: qrToken },
        });
    }

    const checkIn = await prisma.booking_check_ins.create({
        data: {
            id: crypto.randomUUID(),
            booking_id: params.bookingId,
            qr_token: qrToken,
            scanned_at: now,
            scanned_by: params.barberUserId,
            latitude: params.latitude ?? null,
            longitude: params.longitude ?? null,
        },
    });

    return { already_checked_in: false, check_in: checkIn };
}

export async function getClientCheckInPayload(bookingId: string, clientId: string) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: {
            client_id: true,
            qr_check_in_token: true,
            status: true,
            check_in: { select: { scanned_at: true } },
        },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.client_id !== clientId) throw new Error('Unauthorized');

    const token =
        booking.qr_check_in_token ??
        (['confirmed', 'pending', 'completed'].includes(booking.status || '')
            ? await ensureBookingQrToken(bookingId)
            : null);

    return {
        qr_token: token,
        checked_in: !!booking.check_in?.scanned_at,
        scanned_at: booking.check_in?.scanned_at ?? null,
    };
}
