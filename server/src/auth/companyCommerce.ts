/**
 * On-request company commerce activation — DB flag with optional env override for ops.
 */
import { prisma } from '../db/prisma';

const envAllowlist = (): Set<string> => {
    const raw = process.env.COMPANY_COMMERCE_USER_IDS || '';
    return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
};

/** Whether a company account has marketplace commerce enabled. */
export async function isCompanyCommerceEnabled(
    userId: string,
    accountType?: string | null,
): Promise<boolean> {
    if (accountType !== 'company') return false;
    if (envAllowlist().has(userId)) return true;

    const row = await prisma.company_accounts.findUnique({
        where: { user_id: userId },
        select: { commerce_enabled: true },
    });
    return row?.commerce_enabled === true;
}

export async function resolveCompanyCommerceEnabled(user: {
    id: string;
    account_type?: string | null;
}): Promise<boolean> {
    return isCompanyCommerceEnabled(user.id, user.account_type);
}

export async function setCompanyCommerceEnabled(
    userId: string,
    enabled: boolean,
): Promise<{ user_id: string; commerce_enabled: boolean; commerce_enabled_at: string | null }> {
    const account = await prisma.company_accounts.findUnique({
        where: { user_id: userId },
        select: { id: true },
    });
    if (!account) {
        throw new Error('Company account not found for user');
    }

    const now = enabled ? new Date().toISOString() : null;
    const updated = await prisma.company_accounts.update({
        where: { user_id: userId },
        data: {
            commerce_enabled: enabled,
            commerce_enabled_at: now,
        },
        select: {
            user_id: true,
            commerce_enabled: true,
            commerce_enabled_at: true,
        },
    });

    return {
        user_id: updated.user_id,
        commerce_enabled: updated.commerce_enabled === true,
        commerce_enabled_at: updated.commerce_enabled_at,
    };
}
