/** Price locked at booking time — enforce bookings.price_at_booking */

export function assertPriceAtBooking(params: {
    expectedTotal: number;
    submittedPrice: unknown;
    tolerance?: number;
}): number {
    const tolerance = params.tolerance ?? 0.02;
    const got = params.submittedPrice;
    if (typeof got !== 'number' || Number.isNaN(got)) {
        throw new Error('Price mismatch; please refresh your booking summary and try again');
    }
    if (Math.abs(got - params.expectedTotal) > tolerance) {
        throw new Error('Price mismatch; please refresh your booking summary and try again');
    }
    return got;
}

export function lockedBookingPrice(priceAtBooking: number | null | undefined): number {
    return priceAtBooking ?? 0;
}

export function assertNoPostConfirmPriceChange(params: {
    lockedPrice: number | null | undefined;
    newPrice: number | null | undefined;
}): void {
    const locked = params.lockedPrice ?? 0;
    const next = params.newPrice ?? 0;
    if (locked > 0 && Math.abs(locked - next) > 0.02) {
        throw new Error('Service price is locked at booking time and cannot be changed');
    }
}
