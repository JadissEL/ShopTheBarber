/** Returns whether a pending booking is safe to auto-confirm per payment-protection rules. */
export function canAutoConfirmBooking(booking: {
    payment_method?: string | null;
    deposit_amount?: number | null;
    deposit_payment_status?: string | null;
    authorization_amount?: number | null;
    authorization_status?: string | null;
    payment_status?: string | null;
}): { ok: true } | { ok: false; reason: string } {
    const depositDue = (booking.deposit_amount ?? 0) > 0;
    if (depositDue && booking.deposit_payment_status !== 'paid') {
        return { ok: false, reason: 'unpaid_deposit' };
    }

    const authDue = (booking.authorization_amount ?? 0) > 0;
    if (authDue && booking.authorization_status !== 'authorized') {
        return { ok: false, reason: 'missing_authorization' };
    }

    const method = booking.payment_method || 'online';
    if (
        method !== 'cash_at_store' &&
        booking.payment_status === 'unpaid' &&
        !depositDue &&
        !authDue &&
        (booking.authorization_amount ?? 0) <= 0
    ) {
        // Online booking with no deposit/auth metadata yet — wait for client payment step
        return { ok: false, reason: 'payment_pending' };
    }

    return { ok: true };
}
