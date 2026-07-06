import { prisma } from '../db/prisma';
import {
    inferAccountTypeFromLegacyRole,
    isAccountType,
    type AccountType,
} from './accountType';

const VALID_ROLES = new Set([
    'client',
    'barber',
    'shop_owner',
    'seller',
    'company',
    'blogger',
    'admin',
]);

/**
 * Resolve platform role — account_type is canonical when locked.
 * Legacy inference only when account_type is missing (pre-migration users).
 */
export async function resolveAndSyncUserRole(
    userId: string,
    storedRole: string | null | undefined,
): Promise<string> {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true, account_type: true, account_type_locked_at: true },
    });

    if (!user) {
        return storedRole && VALID_ROLES.has(storedRole) ? storedRole : 'client';
    }

    if (user.account_type_locked_at && isAccountType(user.account_type)) {
        const roleFromType =
            user.account_type === 'solo_barber'
                ? 'barber'
                : user.account_type === 'shop'
                  ? 'shop_owner'
                  : user.account_type;

        if (user.role !== roleFromType && user.account_type !== 'client') {
            await prisma.users.update({
                where: { id: userId },
                data: { role: roleFromType, updated_at: new Date().toISOString() },
            });
        }
        return user.role === 'admin' ? 'admin' : roleFromType;
    }

    const normalized =
        storedRole && VALID_ROLES.has(storedRole) ? storedRole : 'client';

    if (normalized === 'admin') return 'admin';

    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true, title: true },
    });

    const ownerMembership = await prisma.shop_members.findFirst({
        where: { user_id: userId, role: 'owner', status: 'active' },
        select: { id: true },
    });

    let inferredAccountType: AccountType | null = null;
    let inferredRole = normalized;

    if (ownerMembership) {
        inferredAccountType = 'shop';
        inferredRole = 'shop_owner';
    } else if (barber) {
        inferredAccountType = 'solo_barber';
        inferredRole = 'barber';
    } else {
        const seller = await prisma.seller_profiles.findUnique({
            where: { user_id: userId },
        });
        if (seller) {
            inferredAccountType = 'seller';
            inferredRole = 'seller';
        } else {
            const company = await prisma.company_accounts.findUnique({
                where: { user_id: userId },
            });
            if (company) {
                inferredAccountType = 'company';
                inferredRole = 'company';
            } else {
                const author = await prisma.author_profiles.findUnique({
                    where: { user_id: userId },
                });
                if (author) {
                    inferredAccountType = 'blogger';
                    inferredRole = 'blogger';
                }
            }
        }
    }

    if (!inferredAccountType) {
        inferredAccountType = inferAccountTypeFromLegacyRole(normalized);
    }

    const now = new Date().toISOString();
    await prisma.users.update({
        where: { id: userId },
        data: {
            role: inferredRole,
            account_type: user.account_type || inferredAccountType,
            account_type_locked_at: user.account_type_locked_at || now,
            updated_at: now,
        },
    });

    return inferredRole;
}
