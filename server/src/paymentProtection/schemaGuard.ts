import { Prisma } from '@prisma/client';
import type { ProviderPaymentPolicy } from './config';

export class PaymentProtectionSchemaNotReadyError extends Error {
    constructor(message = 'Payment protection schema not migrated') {
        super(message);
        this.name = 'PaymentProtectionSchemaNotReadyError';
    }
}

export function isPaymentProtectionSchemaError(err: unknown): boolean {
    if (err instanceof PaymentProtectionSchemaNotReadyError) return true;
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return err.code === 'P2022' || err.code === 'P2021';
    }
    if (err instanceof Error && /does not exist|column .* not found/i.test(err.message)) {
        return true;
    }
    return false;
}

/** Safe defaults when migration has not been applied yet */
export const DISABLED_PAYMENT_POLICY: ProviderPaymentPolicy = {
    card_on_file_required: false,
    deposit_enabled: false,
    deposit_percent: 0,
    deposit_flat_amount: null,
    auth_hold_enabled: false,
    no_show_protection_enabled: false,
    no_show_fee_percent: null,
    no_show_fee_flat_amount: null,
    late_cancel_protection_enabled: false,
    late_cancel_full_refund_hours: 24,
    late_cancel_no_refund_hours: 2,
    late_cancel_fee_percent: 50,
};
