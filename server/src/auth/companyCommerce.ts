/**
 * On-request company commerce activation (Phase 1: env allowlist until admin UI exists).
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
        select: { id: true },
    });
    // Phase 1: no DB flag yet — commerce off unless env allowlisted.
    // When company_accounts.commerce_enabled is added, check it here.
    void row;
    return false;
}

export async function resolveCompanyCommerceEnabled(user: {
    id: string;
    account_type?: string | null;
}): Promise<boolean> {
    return isCompanyCommerceEnabled(user.id, user.account_type);
}
