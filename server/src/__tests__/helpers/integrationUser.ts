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
