import { prisma } from '../db/prisma';
import { resolveBookingPaymentRequirement } from './policy';
import { clientHasSavedCard } from './stripeCustomer';

export { cancelBookingWithPaymentCleanup, getCancellationPreview } from './cancellation';

export type BookingPaymentStatus = {
    booking_id: string;
    status: string | null;
    payment_status: string | null;
    payment_method: string | null;
    deposit_amount: number | null;
    deposit_payment_status: string | null;
    balance_due: number | null;
    authorization_amount: number | null;
    authorization_status: string | null;
    no_show_fee_status: string | null;
    no_show_fee_amount: number | null;
    has_saved_card: boolean;
    /** What the client should do next */
    action_required: 'none' | 'save_card' | 'deposit' | 'auth_hold' | 'full_payment';
    action_label: string | null;
};

function actionLabel(step: BookingPaymentStatus['action_required'], booking: {
    deposit_amount: number | null;
    balance_due: number | null;
}): string | null {
    switch (step) {
        case 'save_card':
            return 'Save card on file';
        case 'deposit':
            return `Pay deposit (€${(booking.deposit_amount ?? 0).toFixed(2)})`;
        case 'auth_hold':
            return 'Authorize card';
        case 'full_payment':
            return 'Pay online';
        default:
            return null;
    }
}

export async function getBookingPaymentStatus(
    bookingId: string,
    userId: string
): Promise<BookingPaymentStatus> {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
            client: { select: { id: true } },
            barber: { select: { user_id: true } },
        },
    });
    if (!booking) throw new Error('Booking not found');

    const isClient = booking.client_id === userId;
    const isProvider = booking.barber.user_id === userId;
    if (!isClient && !isProvider) throw new Error('Unauthorized');

    const hasCard = booking.client_id ? await clientHasSavedCard(booking.client_id) : false;

    let action_required: BookingPaymentStatus['action_required'] = 'none';

    if (isClient && ['pending', 'confirmed'].includes(booking.status || '')) {
        if (booking.deposit_payment_status === 'unpaid' && (booking.deposit_amount ?? 0) > 0) {
            action_required = 'deposit';
        } else if (
            booking.authorization_status === 'none' &&
            (booking.authorization_amount ?? 0) > 0 &&
            booking.payment_status !== 'authorized'
        ) {
            action_required = 'auth_hold';
        } else if (booking.client_id) {
            const req = await resolveBookingPaymentRequirement(
                booking.barber_id,
                booking.shop_id,
                booking.price_at_booking ?? 0,
                booking.payment_method || 'online',
                hasCard,
                booking.client_id
            );
            if (req.next_step !== 'none' && booking.payment_status !== 'paid' && booking.payment_status !== 'partial') {
                action_required = req.next_step;
            } else if (
                booking.payment_status === 'unpaid' &&
                booking.payment_method !== 'cash_at_store' &&
                req.next_step === 'full_payment'
            ) {
                action_required = 'full_payment';
            }
        }
    }

    return {
        booking_id: bookingId,
        status: booking.status,
        payment_status: booking.payment_status,
        payment_method: booking.payment_method,
        deposit_amount: booking.deposit_amount,
        deposit_payment_status: booking.deposit_payment_status,
        balance_due: booking.balance_due,
        authorization_amount: booking.authorization_amount,
        authorization_status: booking.authorization_status,
        no_show_fee_status: booking.no_show_fee_status,
        no_show_fee_amount: booking.no_show_fee_amount,
        has_saved_card: hasCard,
        action_required,
        action_label: actionLabel(action_required, booking),
    };
}
