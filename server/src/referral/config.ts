/**
 * Referral program configs, role-aware, double-sided rewards (Fresha/Booksy patterns).
 */

import { canAccessBookingProviderTools } from '../auth/platformRbac';

export type ReferralProgramType = 'client_b2c' | 'provider_client' | 'pro_b2b';

export type ReferralProgramConfig = {
    type: ReferralProgramType;
    label: string;
    referrer_benefit: string;
    referee_benefit: string;
    referrer_loyalty_points?: number;
    referrer_wallet_credit?: number;
    referee_promo_fixed?: number;
    referee_wallet_credit?: number;
    qualify_event: string;
};

export const REFERRAL_PROGRAMS: Record<ReferralProgramType, ReferralProgramConfig> = {
    client_b2c: {
        type: 'client_b2c',
        label: 'Invite a friend',
        referrer_benefit: '500 loyalty points (~$10) when they complete their first visit',
        referee_benefit: '$10 off first booking',
        referrer_loyalty_points: 500,
        referee_promo_fixed: 10,
        qualify_event: 'referee_first_completed_booking',
    },
    provider_client: {
        type: 'provider_client',
        label: 'Bring a new client',
        referrer_benefit: '$15 wallet credit when they complete their first appointment',
        referee_benefit: '$10 off first booking',
        referrer_wallet_credit: 15,
        referee_promo_fixed: 10,
        qualify_event: 'referee_first_completed_booking',
    },
    pro_b2b: {
        type: 'pro_b2b',
        label: 'Refer a pro or shop',
        referrer_benefit: '$50 platform credit when they go live and complete their first booking',
        referee_benefit: '$25 welcome credit for your shop tools',
        referrer_wallet_credit: 50,
        referee_wallet_credit: 25,
        qualify_event: 'referee_provider_first_completed_booking',
    },
};

export function resolveProgramType(
    referrerRole: string,
    refereeRole: string,
    referrerAccountType?: string | null,
    refereeAccountType?: string | null,
): ReferralProgramType {
    const referrerIsPro = canAccessBookingProviderTools(referrerRole, referrerAccountType);
    const refereeIsPro = canAccessBookingProviderTools(refereeRole, refereeAccountType);
    if (referrerIsPro && refereeIsPro) return 'pro_b2b';
    if (referrerIsPro) return 'provider_client';
    return 'client_b2c';
}

export function programForRole(role: string, accountType?: string | null): ReferralProgramConfig[] {
    if (canAccessBookingProviderTools(role, accountType)) {
        return [REFERRAL_PROGRAMS.provider_client, REFERRAL_PROGRAMS.pro_b2b];
    }
    return [REFERRAL_PROGRAMS.client_b2c];
}
