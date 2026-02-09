import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { parse, addMinutes, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { sendEmail } from './email';

function parseTimeString(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export async function validateBooking(params: {
    barber_id: string,
    shop_id?: string,
    start_datetime: Date,
    duration_minutes: number,
    context_type?: string
}) {
    const { barber_id, shop_id, start_datetime, duration_minutes, context_type } = params;

    const startTime = start_datetime;
    const endTime = addMinutes(startTime, duration_minutes);
    const now = new Date();

    if (startTime < now) {
        return { status: 'ERROR', message: 'Cannot book in the past' };
    }

    // Check Shifts
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[startTime.getDay()] as any;

    const relevantShifts = await db.query.shifts.findMany({
        where: and(
            eq(schema.shifts.barber_id, barber_id),
            eq(schema.shifts.day, dayOfWeek),
            context_type === 'shop' && shop_id ? eq(schema.shifts.shop_id, shop_id) : sql`1=1`
        )
    });

    // If generic fallback logic needed (e.g. 9-5 if no shifts), handle it here.
    // For now, strict shift enforcement.
    if (relevantShifts.length === 0) {
        // Warning: This might block bookings if shifts aren't seeded.
        // Returning unavailable for safety.
        return {
            status: 'UNAVAILABLE',
            reason: 'NO_SHIFTS_DEFINED',
            message: `Barber has no shifts on ${dayOfWeek}`
        };
    }

    const shift = relevantShifts[0];
    const shiftStart = parseTimeString(shift.start_time);
    const shiftEnd = parseTimeString(shift.end_time);

    const bookingStartMin = startTime.getHours() * 60 + startTime.getMinutes();
    const bookingEndMin = endTime.getHours() * 60 + endTime.getMinutes();

    if (bookingStartMin < shiftStart || bookingEndMin > shiftEnd) {
        return {
            status: 'UNAVAILABLE',
            reason: 'OUTSIDE_SHIFT_HOURS',
            message: `Booking outside shift hours (${shift.start_time} - ${shift.end_time})`
        };
    }

    // Check Existing Bookings (Overlap)
    const conflictingBookings = await db.query.bookings.findMany({
        where: and(
            eq(schema.bookings.barber_id, barber_id),
            sql`${schema.bookings.status} NOT IN ('cancelled', 'no_show')`,
            sql`${schema.bookings.start_time} < ${endTime.toISOString()}`,
            sql`${schema.bookings.end_time} > ${startTime.toISOString()}`
        )
    });

    if (conflictingBookings.length > 0) {
        return {
            status: 'UNAVAILABLE',
            reason: 'BOOKING_CONFLICT',
            message: 'Slot is already taken'
        };
    }

    return { status: 'AVAILABLE' };
}

export async function createBookingLogic(payload: any) {
    // 1. Parse Date & Time
    let start_time: Date;
    let end_time: Date;

    try {
        // Try parsing PPP (e.g. July 24th, 2024)
        // Note: 'th' is tricky. date-fns PPP usually handles locale specific long dates.
        // Fallback: simple Date parse if PPP fails or format varies.
        const datePart = parse(payload.date_text, 'PPP', new Date(), { locale: enUS });

        // Parse time (3:30 PM)
        const timePart = parse(payload.time_text, 'h:mm a', new Date(), { locale: enUS });

        // Merge
        start_time = new Date(datePart);
        start_time.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);

        if (isNaN(start_time.getTime())) throw new Error("Invalid Date");

        const duration = payload.duration_at_booking || 30;
        end_time = addMinutes(start_time, duration);

    } catch (e) {
        console.error("Date parsing failed:", e);
        // Fallback: If payload has ISO start_time/end_time? NO, it doesn't.
        throw new Error(`Invalid date/time format: ${payload.date_text} ${payload.time_text}`);
    }

    // 2. Validate Availability
    const validation = await validateBooking({
        barber_id: payload.barber_id,
        shop_id: payload.shop_id,
        start_datetime: start_time,
        duration_minutes: payload.duration_at_booking || 30,
        context_type: payload.context_type
    });

    if (validation.status !== 'AVAILABLE') {
        throw new Error(validation.message);
    }

    // 3. Insert Booking
    const [booking] = await db.insert(schema.bookings).values({
        id: crypto.randomUUID(),
        client_id: payload.client_id,
        barber_id: payload.barber_id,
        shop_id: payload.shop_id,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        status: payload.status || 'pending',
        financial_breakdown: JSON.stringify(payload.financial_breakdown),
        price_at_booking: payload.price_at_booking,
        notes: payload.customer_notes
    }).returning();

    // 4. Create Service Links (Optional for Phase 2 but good for completeness)
    // payload.service_snapshot.services is array
    if (payload.service_snapshot?.services?.length) {
        // TODO: Insert into booking_services if schema supports it
    }

    // 5. Fetch Client & Barber Details for Email
    const client = await db.query.users.findFirst({ where: eq(schema.users.id, payload.client_id) });
    const barber = await db.query.barbers.findFirst({ where: eq(schema.barbers.id, payload.barber_id) });

    // 6. Send Confirmation Email
    if (client?.email) {
        sendEmail({
            to: client.email,
            subject: `Booking Confirmed! 💈`,
            template: 'confirmation',
            data: {
                clientName: client.full_name,
                barberName: barber?.name || 'Your Barber',
                date: payload.date_text,
                time: payload.time_text,
                serviceName: payload.service_snapshot?.services?.[0]?.name || 'Barber Service',
                location: payload.location || 'At the Shop',
                price: `${payload.price_at_booking} EUR`
            }
        }).catch(err => console.error('Failed to send booking email:', err));
    }

    // 7. Audit Log
    console.log(`[AUDIT] Booking ${booking.id} created.`);

    return booking;
}
