import { prisma } from '../../db/prisma';
import { onBookingCancelledTriggerWaitlist } from './logic';

/** Shared hook: after a booking is cancelled, offer the slot to the waitlist queue. */
export async function triggerWaitlistAfterCancel(booking: {
    barber_id: string | null;
    start_time: string | null;
    end_time: string | null;
    status?: string | null;
}) {
    if (!booking.barber_id || !booking.start_time) return null;
    if (booking.status && booking.status !== 'cancelled') return null;
    return onBookingCancelledTriggerWaitlist({
        barber_id: booking.barber_id,
        start_time: booking.start_time,
        end_time: booking.end_time ?? booking.start_time,
    });
}

export async function triggerWaitlistAfterCancelById(bookingId: string) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: { barber_id: true, start_time: true, end_time: true, status: true },
    });
    if (!booking) return null;
    return triggerWaitlistAfterCancel(booking);
}
