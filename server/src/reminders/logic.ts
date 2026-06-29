import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger';
import { sendEmail } from '../logic/email';
import { buildBookingReminderSms, sendSms } from '../logic/sms';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'accepted'];

export type ReminderChannelResult = {
    scanned: number;
    sent: number;
    skipped: number;
    failed: number;
    hours_before: number;
    schema_not_ready?: boolean;
};

export type AllRemindersResult = {
    ok: true;
    sms: ReminderChannelResult;
    email: ReminderChannelResult;
};

type BookingRow = {
    id: string;
    start_time: string;
    service_name: string | null;
    barber_name: string | null;
    barber_id: string;
    client_id: string | null;
};

export function reminderWindowBounds(
    now: Date,
    hoursBefore: number,
    windowMinutes: number
): { windowStartIso: string; windowEndIso: string } {
    const targetMs = now.getTime() + hoursBefore * 60 * 60 * 1000;
    const halfWindowMs = (windowMinutes / 2) * 60 * 1000;
    const windowStart = new Date(targetMs - halfWindowMs);
    const windowEnd = new Date(targetMs + halfWindowMs);
    return {
        windowStartIso: windowStart.toISOString(),
        windowEndIso: windowEnd.toISOString(),
    };
}

function reminderConfig(options?: { hoursBefore?: number; windowMinutes?: number }) {
    const hoursBefore =
        options?.hoursBefore ??
        (parseFloat(process.env.SMS_REMINDER_HOURS_BEFORE || '24') || 24);
    const windowMinutes =
        options?.windowMinutes ??
        (parseFloat(process.env.SMS_REMINDER_WINDOW_MINUTES || '60') || 60);
    return { hoursBefore, windowMinutes };
}

export function formatBookingDateTime(startTimeIso: string): { date: string; time: string } {
    const d = new Date(startTimeIso);
    if (Number.isNaN(d.getTime())) return { date: 'TBD', time: '' };
    return {
        date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
}

async function findBookingsInWindow(
    sentAtField: 'sms_reminder_sent_at' | 'email_reminder_sent_at',
    windowStartIso: string,
    windowEndIso: string
): Promise<BookingRow[] | { schema_not_ready: true }> {
    try {
        return await prisma.bookings.findMany({
            where: {
                [sentAtField]: null,
                client_id: { not: null },
                status: { in: ACTIVE_STATUSES },
                start_time: { gte: windowStartIso, lte: windowEndIso },
            },
            take: 200,
            select: {
                id: true,
                start_time: true,
                service_name: true,
                barber_name: true,
                barber_id: true,
                client_id: true,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
            logger.warn(`[reminders] ${sentAtField} column missing, run prisma migrate deploy`);
            return { schema_not_ready: true };
        }
        if (err instanceof Prisma.PrismaClientValidationError) {
            logger.warn(`[reminders] ${sentAtField} not in Prisma client, run prisma generate && migrate deploy`);
            return { schema_not_ready: true };
        }
        throw err;
    }
}

async function loadBarberContext(barberId: string, barberName: string | null) {
    const row = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { name: true, location: true },
    });
    return {
        name: barberName || row?.name || 'your barber',
        location: row?.location ?? null,
    };
}

export async function processBookingSmsReminders(options?: {
    now?: Date;
    hoursBefore?: number;
    windowMinutes?: number;
}): Promise<ReminderChannelResult> {
    const now = options?.now ?? new Date();
    const { hoursBefore, windowMinutes } = reminderConfig(options);
    const { windowStartIso, windowEndIso } = reminderWindowBounds(now, hoursBefore, windowMinutes);

    const bookings = await findBookingsInWindow('sms_reminder_sent_at', windowStartIso, windowEndIso);
    if ('schema_not_ready' in bookings) {
        return { scanned: 0, sent: 0, skipped: 0, failed: 0, hours_before: hoursBefore, schema_not_ready: true };
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings) {
        if (!booking.client_id) {
            skipped += 1;
            continue;
        }

        const client = await prisma.users.findUnique({
            where: { id: booking.client_id },
            select: { phone: true, sms_reminders_enabled: true },
        });

        if (!client?.phone?.trim() || client.sms_reminders_enabled === false) {
            skipped += 1;
            continue;
        }

        const barber = await loadBarberContext(booking.barber_id, booking.barber_name);
        const startTime = new Date(booking.start_time);
        if (Number.isNaN(startTime.getTime())) {
            skipped += 1;
            continue;
        }

        const result = await sendSms(
            client.phone,
            buildBookingReminderSms({
                barberName: barber.name,
                startTime,
                serviceName: booking.service_name || 'Grooming appointment',
                location: barber.location,
            })
        );

        if (result.success && !result.mocked && result.sid) {
            await prisma.bookings.update({
                where: { id: booking.id },
                data: { sms_reminder_sent_at: new Date().toISOString() },
            });
            sent += 1;
        } else if (result.success && result.mocked) {
            skipped += 1;
        } else {
            failed += 1;
            logger.warn('[reminders] SMS failed', { bookingId: booking.id, error: result.error });
        }
    }

    return { scanned: bookings.length, sent, skipped, failed, hours_before: hoursBefore };
}

export async function processBookingEmailReminders(options?: {
    now?: Date;
    hoursBefore?: number;
    windowMinutes?: number;
}): Promise<ReminderChannelResult> {
    const now = options?.now ?? new Date();
    const { hoursBefore, windowMinutes } = reminderConfig(options);
    const { windowStartIso, windowEndIso } = reminderWindowBounds(now, hoursBefore, windowMinutes);
    const frontend = (process.env.FRONTEND_URL || 'https://shop-the-barber.vercel.app').replace(/\/$/, '');

    const bookings = await findBookingsInWindow('email_reminder_sent_at', windowStartIso, windowEndIso);
    if ('schema_not_ready' in bookings) {
        return { scanned: 0, sent: 0, skipped: 0, failed: 0, hours_before: hoursBefore, schema_not_ready: true };
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings) {
        if (!booking.client_id) {
            skipped += 1;
            continue;
        }

        const client = await prisma.users.findUnique({
            where: { id: booking.client_id },
            select: { email: true, full_name: true, email_reminders_enabled: true },
        });

        if (!client?.email?.trim() || client.email_reminders_enabled === false) {
            skipped += 1;
            continue;
        }

        const barber = await loadBarberContext(booking.barber_id, booking.barber_name);
        const { date, time } = formatBookingDateTime(booking.start_time);

        const result = await sendEmail({
            to: client.email,
            subject: `Reminder: Appointment with ${barber.name}`,
            template: 'reminder',
            data: {
                clientName: client.full_name,
                barberName: barber.name,
                date,
                time,
                serviceName: booking.service_name || 'Grooming appointment',
                location: barber.location,
                manageUrl: `${frontend}/UserBookings`,
            },
        });

        if (result.success && !result.mocked && result.id) {
            await prisma.bookings.update({
                where: { id: booking.id },
                data: { email_reminder_sent_at: new Date().toISOString() },
            });
            sent += 1;
        } else if (result.success && result.mocked) {
            skipped += 1;
        } else {
            failed += 1;
            logger.warn('[reminders] Email failed', { bookingId: booking.id, error: result.error });
        }
    }

    return { scanned: bookings.length, sent, skipped, failed, hours_before: hoursBefore };
}

export async function processAllBookingReminders(options?: {
    now?: Date;
    hoursBefore?: number;
    windowMinutes?: number;
}): Promise<AllRemindersResult> {
    const [sms, email] = await Promise.all([
        processBookingSmsReminders(options),
        processBookingEmailReminders(options),
    ]);
    return { ok: true, sms, email };
}
