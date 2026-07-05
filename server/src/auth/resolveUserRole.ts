import { prisma } from '../db/prisma';

const VALID_ROLES = new Set(['client', 'barber', 'shop_owner', 'admin']);

/**
 * Infer provider role from barber / shop membership when users.role is still `client`
 * (e.g. provider signup completed onboarding but role update failed or was skipped).
 */
export async function resolveAndSyncUserRole(
    userId: string,
    storedRole: string | null | undefined
): Promise<string> {
    const normalized =
        storedRole && VALID_ROLES.has(storedRole) ? storedRole : 'client';

    if (normalized === 'admin' || normalized === 'barber' || normalized === 'shop_owner') {
        return normalized;
    }

    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true, title: true },
    });

    const ownerMembership = await prisma.shop_members.findFirst({
        where: { user_id: userId, role: 'owner', status: 'active' },
        select: { id: true },
    });

    const teamMembership = await prisma.shop_members.findFirst({
        where: { user_id: userId, status: 'active' },
        select: { id: true },
    });

    let inferred: string | null = null;

    if (ownerMembership) {
        if (barber?.title === 'Shop Owner') inferred = 'shop_owner';
        else if (barber?.title === 'Independent Barber') inferred = 'barber';
        else inferred = 'shop_owner';
    } else if (barber) {
        inferred = 'barber';
    } else if (teamMembership) {
        inferred = 'barber';
    }

    if (inferred && inferred !== normalized) {
        await prisma.users.update({
            where: { id: userId },
            data: { role: inferred, updated_at: new Date().toISOString() },
        });
        return inferred;
    }

    return normalized;
}
