/** Reserved ledger event types — see docs/specs/FINANCIAL_ECOSYSTEM.md */
export const LEDGER_EVENT_TYPES = [
    'recharge',
    'promotional_credit',
    'referral_bonus',
    'cashback',
    'marketplace_reward',
    'subscription_payment',
    'commission',
    'cancellation_penalty',
    'deposit_lock',
    'deposit_release',
    'deposit_forfeit',
    'championship_reward',
    'manual_adjustment',
    'refund',
    'withdrawal',
    'chargeback',
    'loyalty_bonus',
    'compensation',
    'goodwill_credit',
    'tax_adjustment',
    'future_financing',
    'future_gift_card',
    'future_tip',
    'future_insurance_reward',
    // Existing provider/client mappings
    'top_up',
    'platform_fee',
    'fee_refund',
    'penalty',
    'referral_credit',
] as const;

export type LedgerEventType = (typeof LEDGER_EVENT_TYPES)[number];

const LEDGER_SET = new Set<string>(LEDGER_EVENT_TYPES);

export function isValidLedgerEventType(type: string): type is LedgerEventType {
    return LEDGER_SET.has(type);
}

export function assertValidLedgerEventType(type: string): LedgerEventType {
    if (!isValidLedgerEventType(type)) {
        throw new Error(`Invalid ledger event type: ${type}`);
    }
    return type;
}
