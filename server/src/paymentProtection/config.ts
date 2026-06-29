/** Platform defaults for booking payment protection (Booksy/Squire-style). */
export const DEFAULT_DEPOSIT_PERCENT = 20;
export const DEFAULT_NO_SHOW_FEE_PERCENT = 100;
export const DEFAULT_LATE_CANCEL_FULL_REFUND_HOURS = 24;
export const DEFAULT_LATE_CANCEL_NO_REFUND_HOURS = 2;
export const DEFAULT_LATE_CANCEL_FEE_PERCENT = 50;

export type ProviderPaymentPolicy = {
    card_on_file_required: boolean;
    deposit_enabled: boolean;
    deposit_percent: number;
    deposit_flat_amount: number | null;
    auth_hold_enabled: boolean;
    no_show_protection_enabled: boolean;
    no_show_fee_percent: number | null;
    no_show_fee_flat_amount: number | null;
    late_cancel_protection_enabled: boolean;
    late_cancel_full_refund_hours: number;
    late_cancel_no_refund_hours: number;
    late_cancel_fee_percent: number;
};

export type BookingPaymentRequirement = {
    policy: ProviderPaymentPolicy;
    /** What the client must complete after booking */
    next_step: 'none' | 'save_card' | 'deposit' | 'auth_hold' | 'full_payment';
    deposit_amount: number | null;
    balance_due: number | null;
    authorization_amount: number | null;
    requires_card_on_file: boolean;
};

export const PAYMENT_PROTECTION_FIELDS = {
    barber: {
        card_on_file_required: true,
        booking_deposit_enabled: true,
        booking_deposit_percent: true,
        booking_deposit_flat_amount: true,
        booking_auth_hold_enabled: true,
        no_show_protection_enabled: true,
        no_show_fee_percent: true,
        no_show_fee_flat_amount: true,
        late_cancel_protection_enabled: true,
        late_cancel_full_refund_hours: true,
        late_cancel_no_refund_hours: true,
        late_cancel_fee_percent: true,
    },
    shop: {
        card_on_file_required: true,
        booking_deposit_enabled: true,
        booking_deposit_percent: true,
        booking_deposit_flat_amount: true,
        booking_auth_hold_enabled: true,
        no_show_protection_enabled: true,
        no_show_fee_percent: true,
        no_show_fee_flat_amount: true,
        late_cancel_protection_enabled: true,
        late_cancel_full_refund_hours: true,
        late_cancel_no_refund_hours: true,
        late_cancel_fee_percent: true,
    },
} as const;
