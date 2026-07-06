import { createHash, randomBytes } from 'crypto';
import { prisma } from '../db/prisma';
import {
    type AccountType,
    isAccountType,
    platformRoleForAccountType,
} from './accountType';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

const INTENT_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export async function createSignupIntent(accountType: AccountType): Promise<{
    token: string;
    accountType: AccountType;
    expiresAt: string;
}> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INTENT_TTL_MS);

    await prisma.signup_intents.create({
        data: {
            id: crypto.randomUUID(),
            token_hash: hashToken(token),
            account_type: accountType,
            expires_at: expiresAt,
        },
    });

    return { token, accountType, expiresAt: expiresAt.toISOString() };
}

export async function consumeSignupIntent(
    token: string,
): Promise<AccountType | null> {
    if (!token?.trim()) return null;
    const row = await prisma.signup_intents.findUnique({
        where: { token_hash: hashToken(token.trim()) },
    });
    if (!row || row.consumed_at) return null;
    if (row.expires_at < new Date()) return null;
    if (!isAccountType(row.account_type)) return null;

    await prisma.signup_intents.update({
        where: { id: row.id },
        data: { consumed_at: new Date() },
    });

    return row.account_type;
}

type ClerkProfile = {
    clerk_user_id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
};

async function syncClerkMetadata(clerkUserId: string, accountType: AccountType, role: string) {
    try {
        await clerkClient.users.updateUserMetadata(clerkUserId, {
            publicMetadata: {
                accountType,
                role,
                provisionedAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.warn('Failed to sync Clerk metadata:', err);
    }
}

async function createSoloBarberWorkspace(userId: string, fullName: string) {
    const barber = await prisma.barbers.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            name: fullName || 'Your Barber Profile',
            title: 'Independent Barber',
            location: '',
            status: 'active',
        },
    });

    const shop = await prisma.shops.create({
        data: {
            id: crypto.randomUUID(),
            name: `${fullName || 'My'} Chair`,
            location: 'Add your address in the next step',
            description: '',
            owner_id: userId,
        },
    });

    await prisma.shop_members.create({
        data: {
            id: crypto.randomUUID(),
            shop_id: shop.id,
            user_id: userId,
            barber_id: barber.id,
            role: 'owner',
            status: 'active',
            booking_enabled: true,
        },
    });

    await prisma.barbers.update({
        where: { id: barber.id },
        data: { shop_id: shop.id },
    });

    return { barber, shop };
}

async function createShopWorkspace(userId: string, fullName: string) {
    const barber = await prisma.barbers.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            name: fullName || 'Shop Owner',
            title: 'Shop Owner',
            location: '',
            status: 'active',
        },
    });

    const shop = await prisma.shops.create({
        data: {
            id: crypto.randomUUID(),
            name: `${fullName || 'My'} Barbershop`,
            location: 'Add your address in the next step',
            description: '',
            owner_id: userId,
        },
    });

    await prisma.shop_members.create({
        data: {
            id: crypto.randomUUID(),
            shop_id: shop.id,
            user_id: userId,
            barber_id: barber.id,
            role: 'owner',
            status: 'active',
            booking_enabled: true,
        },
    });

    await prisma.barbers.update({
        where: { id: barber.id },
        data: { shop_id: shop.id },
    });

    return { barber, shop };
}

async function createTypedProfiles(
    userId: string,
    accountType: AccountType,
    fullName: string,
) {
    switch (accountType) {
        case 'solo_barber':
            await createSoloBarberWorkspace(userId, fullName);
            break;
        case 'shop':
            await createShopWorkspace(userId, fullName);
            break;
        case 'seller':
            await prisma.seller_profiles.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    display_name: fullName || 'My Store',
                    seller_type: 'vendor',
                },
            });
            break;
        case 'company': {
            const company = await prisma.companies.create({
                data: {
                    id: crypto.randomUUID(),
                    name: `${fullName || 'My'} Company`,
                    description: 'Complete your company profile to start hiring.',
                },
            });
            await prisma.company_accounts.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    company_id: company.id,
                },
            });
            break;
        }
        case 'blogger':
            await prisma.author_profiles.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    pen_name: fullName || null,
                },
            });
            break;
        case 'client':
        default:
            break;
    }
}

export type ProvisionResult =
    | { ok: true; user: Awaited<ReturnType<typeof prisma.users.findUnique>> }
    | { ok: false; code: string; message: string };

/**
 * Provision a new platform user after Clerk signup with immutable account type.
 */
export async function provisionUser(params: {
    profile: ClerkProfile;
    accountType: AccountType;
    signupIntentToken?: string | null;
}): Promise<ProvisionResult> {
    const { profile, accountType, signupIntentToken } = params;

    if (signupIntentToken) {
        const consumed = await consumeSignupIntent(signupIntentToken);
        if (consumed !== accountType) {
            return {
                ok: false,
                code: 'INVALID_SIGNUP_INTENT',
                message: 'Signup session expired or invalid. Please choose your account type again.',
            };
        }
    }

    const existingByClerk = await prisma.users.findUnique({
        where: { clerk_user_id: profile.clerk_user_id },
    });
    if (existingByClerk) {
        return { ok: true, user: existingByClerk };
    }

    const existingByEmail = await prisma.users.findUnique({
        where: { email: profile.email },
    });

    if (existingByEmail) {
        if (
            existingByEmail.account_type &&
            existingByEmail.account_type !== accountType
        ) {
            return {
                ok: false,
                code: 'ACCOUNT_TYPE_CONFLICT',
                message: `This email is already registered as a ${existingByEmail.account_type.replace('_', ' ')}. Each email can only have one account type.`,
            };
        }

        const linked = await prisma.users.update({
            where: { id: existingByEmail.id },
            data: {
                clerk_user_id: profile.clerk_user_id,
                avatar_url: existingByEmail.avatar_url || profile.avatar_url || undefined,
                full_name: existingByEmail.full_name || profile.full_name || undefined,
                updated_at: new Date().toISOString(),
            },
        });
        return { ok: true, user: linked };
    }

    const role = platformRoleForAccountType(accountType);
    const now = new Date().toISOString();
    const avatar =
        profile.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.email.split('@')[0] || 'User')}&background=random`;

    const user = await prisma.users.create({
        data: {
            id: crypto.randomUUID(),
            clerk_user_id: profile.clerk_user_id,
            email: profile.email,
            full_name: profile.full_name || profile.email.split('@')[0] || 'User',
            role,
            account_type: accountType,
            account_type_locked_at: now,
            avatar_url: avatar,
        },
    });

    await createTypedProfiles(user.id, accountType, user.full_name || '');

    await syncClerkMetadata(profile.clerk_user_id, accountType, role);

    const refreshed = await prisma.users.findUnique({ where: { id: user.id } });
    return { ok: true, user: refreshed };
}

export async function findUserByClerkProfile(profile: ClerkProfile) {
    const byClerk = await prisma.users.findUnique({
        where: { clerk_user_id: profile.clerk_user_id },
    });
    if (byClerk) return byClerk;

    return prisma.users.findUnique({ where: { email: profile.email } });
}
