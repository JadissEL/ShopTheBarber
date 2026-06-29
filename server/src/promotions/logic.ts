import { randomUUID } from 'crypto';
import { prisma } from '../db/prisma';
import { enforcePromoOnWrite } from '../pricing/enforce';
import { getActivePricingPolicy, validatePromoValues } from '../pricing/logic';
import {
    AUDIENCE_LABELS,
    audienceRequiresTargets,
    parseAudience,
    targetTypeForAudience,
    type PromoAudience,
} from './config';
import {
    countPromoUses,
    loadPromoById,
    resolveAudience,
    targetIdsByType,
} from './targeting';

export interface AdminPromoInput {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    audience?: PromoAudience;
    target_ids?: string[];
    expiry_date?: string | null;
    is_active?: boolean;
    max_uses?: number | null;
    max_uses_per_user?: number | null;
    admin_note?: string | null;
    bypass_policy?: boolean;
}

function normalizeCode(code: string): string {
    return code.trim().toUpperCase();
}

function syncLegacyColumns(audience: PromoAudience, targetIds: string[]) {
    let shop_id: string | null = null;
    let owner_user_id: string | null = null;

    if (audience === 'specific_shops' && targetIds.length === 1) {
        shop_id = targetIds[0] ?? null;
    }
    if (audience === 'specific_users' && targetIds.length === 1) {
        owner_user_id = targetIds[0] ?? null;
    }

    return { shop_id, owner_user_id };
}

async function validateTargetsExist(audience: PromoAudience, targetIds: string[]) {
    if (!audienceRequiresTargets(audience)) return;
    if (targetIds.length === 0) {
        throw new Error(`Audience "${audience}" requires at least one target`);
    }

    const type = targetTypeForAudience(audience)!;
    if (type === 'user') {
        const found = await prisma.users.count({ where: { id: { in: targetIds } } });
        if (found !== targetIds.length) throw new Error('One or more user targets not found');
    } else if (type === 'shop') {
        const found = await prisma.shops.count({ where: { id: { in: targetIds } } });
        if (found !== targetIds.length) throw new Error('One or more shop targets not found');
    } else if (type === 'barber') {
        const found = await prisma.barbers.count({ where: { id: { in: targetIds } } });
        if (found !== targetIds.length) throw new Error('One or more barber targets not found');
    }
}

async function replaceTargets(promoCodeId: string, audience: PromoAudience, targetIds: string[]) {
    await prisma.promo_code_targets.deleteMany({ where: { promo_code_id: promoCodeId } });

    const type = targetTypeForAudience(audience);
    if (!type || targetIds.length === 0) return;

    const unique = [...new Set(targetIds)];
    await prisma.promo_code_targets.createMany({
        data: unique.map((target_id) => ({
            id: randomUUID(),
            promo_code_id: promoCodeId,
            target_type: type,
            target_id,
        })),
    });
}

async function enrichPromoRow(row: NonNullable<Awaited<ReturnType<typeof loadPromoById>>>) {
    const audience = resolveAudience(row);
    const userIds = targetIdsByType(row, 'user');
    const shopIds = targetIdsByType(row, 'shop');
    const barberIds = targetIdsByType(row, 'barber');

    const [users, shops, barbers, usage] = await Promise.all([
        userIds.length
            ? prisma.users.findMany({
                  where: { id: { in: userIds } },
                  select: { id: true, email: true, full_name: true },
              })
            : Promise.resolve([]),
        shopIds.length
            ? prisma.shops.findMany({
                  where: { id: { in: shopIds } },
                  select: { id: true, name: true, location: true },
              })
            : Promise.resolve([]),
        barberIds.length
            ? prisma.barbers.findMany({
                  where: { id: { in: barberIds } },
                  select: { id: true, name: true, location: true },
              })
            : Promise.resolve([]),
        countPromoUses(row.code).catch(() => ({ totalUses: 0, userUses: 0 })),
    ]);

    const discount_text =
        row.discount_type === 'percentage'
            ? `${row.discount_value}% off`
            : `€${row.discount_value} off`;

    return {
        id: row.id,
        code: row.code,
        discount_type: row.discount_type,
        discount_value: row.discount_value,
        discount_text,
        audience,
        audience_label: AUDIENCE_LABELS[audience],
        target_ids: { users: userIds, shops: shopIds, barbers: barberIds },
        targets: {
            users: users.map((u) => ({ id: u.id, label: u.full_name || u.email || u.id })),
            shops: shops.map((s) => ({ id: s.id, label: s.name || s.location || s.id })),
            barbers: barbers.map((b) => ({ id: b.id, label: b.name || b.location || b.id })),
        },
        expiry_date: row.expiry_date,
        is_active: row.is_active ?? true,
        max_uses: row.max_uses,
        max_uses_per_user: row.max_uses_per_user ?? 1,
        admin_note: row.admin_note,
        shop_id: row.shop_id,
        owner_user_id: row.owner_user_id,
        usage: {
            total: usage.totalUses,
            remaining: row.max_uses != null ? Math.max(0, row.max_uses - usage.totalUses) : null,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

export async function listAdminPromotions() {
    const rows = await prisma.promo_codes.findMany({
        include: { targets: true },
        orderBy: [{ is_active: 'desc' }, { code: 'asc' }],
        take: 500,
    });

    return Promise.all(rows.map((row) => enrichPromoRow(row)));
}

export async function getAdminPromotion(id: string) {
    const row = await loadPromoById(id);
    if (!row) return null;
    return enrichPromoRow(row);
}

export async function createAdminPromotion(input: AdminPromoInput) {
    const code = normalizeCode(input.code);
    if (!code) throw new Error('code is required');

    const audience = parseAudience(input.audience ?? 'everyone');
    const targetIds = [...new Set((input.target_ids ?? []).filter(Boolean))];

    await validateTargetsExist(audience, targetIds);

    const data = {
        code,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        audience,
        expiry_date: input.expiry_date ?? null,
        is_active: input.is_active ?? true,
        max_uses: input.max_uses ?? null,
        max_uses_per_user: input.max_uses_per_user ?? 1,
        admin_note: input.admin_note ?? null,
        ...syncLegacyColumns(audience, targetIds),
    };

    if (input.bypass_policy) {
        const policy = await getActivePricingPolicy();
        validatePromoValues(data.discount_type, data.discount_value, {
            ...policy,
            max_promo_percentage: 100,
            max_promo_fixed: 10000,
        });
    } else {
        await enforcePromoOnWrite(data);
    }

    const created = await prisma.promo_codes.create({ data });
    await replaceTargets(created.id, audience, targetIds);

    const full = await loadPromoById(created.id);
    if (!full) throw new Error('Failed to load created promo');
    return enrichPromoRow(full);
}

export async function updateAdminPromotion(id: string, input: Partial<AdminPromoInput>) {
    const existing = await loadPromoById(id);
    if (!existing) throw new Error('Promo not found');

    const audience = input.audience ? parseAudience(input.audience) : resolveAudience(existing);
    const shouldReplaceTargets = input.target_ids !== undefined || input.audience !== undefined;

    let uniqueTargets: string[] = [];
    if (input.target_ids !== undefined) {
        uniqueTargets = [...new Set(input.target_ids.filter(Boolean))];
    } else if (input.audience !== undefined) {
        const type = targetTypeForAudience(audience);
        if (type) uniqueTargets = targetIdsByType(existing, type);
    }

    if (shouldReplaceTargets && audienceRequiresTargets(audience)) {
        await validateTargetsExist(audience, uniqueTargets);
    }

    const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (input.code !== undefined) patch.code = normalizeCode(input.code);
    if (input.discount_type !== undefined) patch.discount_type = input.discount_type;
    if (input.discount_value !== undefined) patch.discount_value = input.discount_value;
    if (input.audience !== undefined) patch.audience = audience;
    if (input.expiry_date !== undefined) patch.expiry_date = input.expiry_date;
    if (input.is_active !== undefined) patch.is_active = input.is_active;
    if (input.max_uses !== undefined) patch.max_uses = input.max_uses;
    if (input.max_uses_per_user !== undefined) patch.max_uses_per_user = input.max_uses_per_user;
    if (input.admin_note !== undefined) patch.admin_note = input.admin_note;

    if (input.audience !== undefined || input.target_ids !== undefined) {
        Object.assign(patch, syncLegacyColumns(audience, uniqueTargets));
    }

    if (input.discount_type !== undefined || input.discount_value !== undefined) {
        const checkData = {
            discount_type: String(patch.discount_type ?? existing.discount_type),
            discount_value: Number(patch.discount_value ?? existing.discount_value),
        };
        if (input.bypass_policy) {
            const policy = await getActivePricingPolicy();
            validatePromoValues(checkData.discount_type, checkData.discount_value, {
                ...policy,
                max_promo_percentage: 100,
                max_promo_fixed: 10000,
            });
        } else if (!existing.owner_user_id) {
            await enforcePromoOnWrite(checkData);
        }
    }

    await prisma.promo_codes.update({ where: { id }, data: patch });

    if (shouldReplaceTargets) {
        await replaceTargets(id, audience, uniqueTargets);
    }

    const full = await loadPromoById(id);
    if (!full) throw new Error('Failed to load updated promo');
    return enrichPromoRow(full);
}

export async function deactivateAdminPromotion(id: string) {
    return updateAdminPromotion(id, { is_active: false });
}

export function getPromoAdminConfig() {
    return {
        audiences: Object.entries(AUDIENCE_LABELS).map(([value, label]) => ({ value, label })),
        defaults: { max_uses: 100, max_uses_per_user: 1 },
    };
}
