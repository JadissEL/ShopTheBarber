/**
 * Seed provisioned users for integration tests.
 * Auth no longer auto-creates DB rows — tests must provision explicitly.
 */
import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import {
    type AccountType,
    platformRoleForAccountType,
} from '../../auth/accountType';

export type SeedIntegrationUserInput = {
    clerkUserId: string;
    email: string;
    accountType?: AccountType;
    role?: string;
    fullName?: string;
    id?: string;
};

export async function seedProvisionedUser(input: SeedIntegrationUserInput) {
    const accountType = input.accountType ?? accountTypeFromRoleHint(input.role);
    const role = input.role ?? platformRoleForAccountType(accountType);
    const now = new Date().toISOString();

    return prisma.users.upsert({
        where: { email: input.email },
        create: {
            id: input.id ?? crypto.randomUUID(),
            clerk_user_id: input.clerkUserId,
            email: input.email,
            full_name: input.fullName ?? 'Integration Test User',
            role,
            account_type: accountType,
            account_type_locked_at: now,
            updated_at: now,
        },
        update: {
            clerk_user_id: input.clerkUserId,
            full_name: input.fullName ?? 'Integration Test User',
            role,
            account_type: accountType,
            account_type_locked_at: now,
            updated_at: now,
        },
    });
}

function accountTypeFromRoleHint(role?: string): AccountType {
    if (role === 'shop_owner') return 'shop';
    if (role === 'barber' || role === 'provider') return 'solo_barber';
    if (role === 'seller') return 'seller';
    if (role === 'company') return 'company';
    if (role === 'blogger') return 'blogger';
    if (role === 'admin') return 'client';
    return 'client';
}

export async function seedSellerProfile(userId: string, displayName = 'Test Store') {
    return prisma.seller_profiles.upsert({
        where: { user_id: userId },
        create: {
            id: crypto.randomUUID(),
            user_id: userId,
            display_name: displayName,
            seller_type: 'vendor',
        },
        update: { display_name: displayName },
    });
}

export async function seedCompanyWorkspace(
    userId: string,
    companyName = 'Test Company',
    options?: { commerceEnabled?: boolean },
) {
    const existing = await prisma.company_accounts.findUnique({ where: { user_id: userId } });
    if (existing) {
        if (options?.commerceEnabled) {
            await prisma.company_accounts.update({
                where: { user_id: userId },
                data: {
                    commerce_enabled: true,
                    commerce_enabled_at: new Date().toISOString(),
                },
            });
        }
        const company = await prisma.companies.findUnique({ where: { id: existing.company_id } });
        return { companyId: existing.company_id, company };
    }
    const companyId = crypto.randomUUID();
    const now = new Date().toISOString();
    await prisma.companies.create({
        data: {
            id: companyId,
            name: companyName,
            description: 'Integration test company with enough description text.',
        },
    });
    await prisma.company_accounts.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            company_id: companyId,
            commerce_enabled: options?.commerceEnabled ?? false,
            commerce_enabled_at: options?.commerceEnabled ? now : null,
        },
    });
    return { companyId };
}

export async function seedAuthorProfile(userId: string, penName = 'Test Author') {
    return prisma.author_profiles.upsert({
        where: { user_id: userId },
        create: {
            id: crypto.randomUUID(),
            user_id: userId,
            pen_name: penName,
            bio: 'Integration test author bio with enough characters.',
        },
        update: { pen_name: penName },
    });
}

export async function seedSoloBarberRecord(userId: string, name = 'Solo Barber') {
    const existing = await prisma.barbers.findFirst({ where: { user_id: userId } });
    if (existing) return existing;
    return prisma.barbers.create({
        data: {
            user_id: userId,
            name,
            title: 'Independent Barber',
            updated_at: new Date().toISOString(),
        },
    });
}

export async function seedShopWorkspace(userId: string, shopName = 'Test Shop') {
    const existingShop = await prisma.shops.findFirst({ where: { owner_id: userId } });
    if (existingShop) {
        const barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
        return { shop: existingShop, barber, shopId: existingShop.id, barberId: barber?.id };
    }
    const shopId = crypto.randomUUID();
    const barber = await seedSoloBarberRecord(userId, 'Shop Owner');
    const shop = await prisma.shops.create({
        data: {
            id: shopId,
            owner_id: userId,
            name: shopName,
            location: '123 Test St',
            updated_at: new Date().toISOString(),
        },
    });
    await prisma.shop_members.create({
        data: {
            id: crypto.randomUUID(),
            shop_id: shopId,
            barber_id: barber.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
            booking_enabled: true,
        },
    });
    await prisma.barbers.update({
        where: { id: barber.id },
        data: { shop_id: shopId },
    });
    return { shop, barber, shopId, barberId: barber.id };
}

/** Merge account_type fields into prisma.users.create data for legacy test seeds. */
export function withProvisionedAccountFields<T extends { role?: string | null }>(
    data: T,
    accountType?: AccountType,
): T & { account_type: AccountType; account_type_locked_at: string } {
    const type = accountType ?? accountTypeFromRoleHint(data.role ?? undefined);
    const now = new Date().toISOString();
    return {
        ...data,
        account_type: type,
        account_type_locked_at: now,
    };
}
