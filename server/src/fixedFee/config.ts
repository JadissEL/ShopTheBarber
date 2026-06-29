export const ENROLLMENT_MONTHS = [1, 2, 3] as const; // January-March only

export const ANNUAL_DISCOUNT_PERCENT = 30;

export const DEFAULT_MONTHLY_FEE_BARBER = 79;
export const DEFAULT_MONTHLY_FEE_SHOP = 149;

export const BILLING_CYCLES = ['monthly', 'annual'] as const;
export const PLAN_SCOPES = ['barber', 'shop'] as const;
export const PLAN_STATUSES = ['pending_payment', 'active', 'expired', 'cancelled'] as const;

export const PROVIDER_ROLES = new Set(['barber', 'provider', 'shop_owner', 'admin']);

export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type PlanScope = (typeof PLAN_SCOPES)[number];
