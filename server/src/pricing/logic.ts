import type { pricing_rules, service_bundles } from '@prisma/client';
import { prisma } from '../db/prisma';
import { validatePromoCode } from '../logic/promoCode';

export type PricingPolicy = {
    min_service_price: number;
    max_service_price: number;
    max_promo_percentage: number;
    max_promo_fixed: number;
    max_combo_discount_percent: number;
    min_combo_services: number;
    commission_freelancer: number;
    commission_shop: number;
    fixed_fee_monthly_barber: number;
    fixed_fee_monthly_shop: number;
};

export const DEFAULT_POLICY: PricingPolicy = {
    min_service_price: 5,
    max_service_price: 500,
    max_promo_percentage: 30,
    max_promo_fixed: 75,
    max_combo_discount_percent: 35,
    min_combo_services: 2,
    commission_freelancer: 0.1,
    commission_shop: 0.05,
    fixed_fee_monthly_barber: 79,
    fixed_fee_monthly_shop: 149,
};

export async function getActivePricingPolicy(): Promise<PricingPolicy> {
    const row = await prisma.pricing_rules.findFirst({
        where: { is_active: true },
        orderBy: { id: 'asc' },
    });
    if (!row) return DEFAULT_POLICY;
    return policyFromRow(row);
}

function policyFromRow(row: pricing_rules): PricingPolicy {
    return {
        min_service_price: row.min_service_price ?? DEFAULT_POLICY.min_service_price,
        max_service_price: row.max_service_price ?? DEFAULT_POLICY.max_service_price,
        max_promo_percentage: row.max_promo_percentage ?? DEFAULT_POLICY.max_promo_percentage,
        max_promo_fixed: row.max_promo_fixed ?? DEFAULT_POLICY.max_promo_fixed,
        max_combo_discount_percent: row.max_combo_discount_percent ?? DEFAULT_POLICY.max_combo_discount_percent,
        min_combo_services: row.min_combo_services ?? DEFAULT_POLICY.min_combo_services,
        commission_freelancer: row.commission_freelancer ?? DEFAULT_POLICY.commission_freelancer,
        commission_shop: row.commission_shop ?? DEFAULT_POLICY.commission_shop,
        fixed_fee_monthly_barber: row.fixed_fee_monthly_barber ?? DEFAULT_POLICY.fixed_fee_monthly_barber,
        fixed_fee_monthly_shop: row.fixed_fee_monthly_shop ?? DEFAULT_POLICY.fixed_fee_monthly_shop,
    };
}

export function validateServicePrice(price: number, policy: PricingPolicy = DEFAULT_POLICY): void {
    if (!Number.isFinite(price)) throw new Error('Service price must be a number');
    if (price < policy.min_service_price) {
        throw new Error(`Service price must be at least $${policy.min_service_price}`);
    }
    if (price > policy.max_service_price) {
        throw new Error(`Service price cannot exceed $${policy.max_service_price} (platform limit)`);
    }
}

export function validatePromoValues(
    discount_type: string,
    discount_value: number,
    policy: PricingPolicy = DEFAULT_POLICY
): void {
    if (discount_type !== 'percentage' && discount_type !== 'fixed') {
        throw new Error('discount_type must be percentage or fixed');
    }
    if (!Number.isFinite(discount_value) || discount_value <= 0) {
        throw new Error('discount_value must be a positive number');
    }
    if (discount_type === 'percentage') {
        if (discount_value > policy.max_promo_percentage) {
            throw new Error(`Promo discount cannot exceed ${policy.max_promo_percentage}% (platform limit)`);
        }
    } else if (discount_value > policy.max_promo_fixed) {
        throw new Error(`Fixed promo discount cannot exceed $${policy.max_promo_fixed} (platform limit)`);
    }
}

export function computeBundleFinalPrice(
    sumPrice: number,
    bundle: Pick<service_bundles, 'bundle_price' | 'discount_type' | 'discount_value'>,
    policy: PricingPolicy
): number {
    if (sumPrice <= 0) throw new Error('Bundle requires services with positive prices');

    let finalPrice: number;
    if (bundle.bundle_price != null && Number.isFinite(bundle.bundle_price)) {
        finalPrice = bundle.bundle_price;
    } else if (bundle.discount_type === 'percentage' && bundle.discount_value != null) {
        const pct = Number(bundle.discount_value);
        finalPrice = Math.round(sumPrice * (1 - pct / 100) * 100) / 100;
    } else if (bundle.discount_type === 'fixed' && bundle.discount_value != null) {
        finalPrice = Math.round((sumPrice - Number(bundle.discount_value)) * 100) / 100;
    } else {
        throw new Error('Bundle must define bundle_price or discount_type + discount_value');
    }

    if (finalPrice >= sumPrice) {
        throw new Error('Combo price must be lower than the sum of individual service prices');
    }

    const minAllowed = Math.round(sumPrice * (1 - policy.max_combo_discount_percent / 100) * 100) / 100;
    if (finalPrice < minAllowed) {
        throw new Error(
            `Combo discount cannot exceed ${policy.max_combo_discount_percent}% off (minimum combo price $${minAllowed})`
        );
    }

    return Math.max(0.01, finalPrice);
}

export type ResolvedServiceLine = {
    id: string;
    name: string;
    category: string | null;
    price: number;
    duration_minutes: number;
};

export async function resolveServiceLines(
    serviceIds: string[],
    options?: { barber_id?: string | null; shop_member_id?: string | null }
): Promise<ResolvedServiceLine[]> {
    if (serviceIds.length === 0) return [];
    const uniqueIds = [...new Set(serviceIds)];
    const rows = await prisma.services.findMany({ where: { id: { in: uniqueIds } } });
    if (rows.length !== uniqueIds.length) {
        throw new Error('One or more services were not found');
    }

    let staffConfigs: Map<string, { custom_price: number | null; custom_duration: number | null }> = new Map();
    if (options?.shop_member_id) {
        const configs = await prisma.staff_service_configs.findMany({
            where: { shop_member_id: options.shop_member_id, service_id: { in: uniqueIds } },
        });
        staffConfigs = new Map(
            configs.map((c) => [
                c.service_id!,
                { custom_price: c.custom_price, custom_duration: c.custom_duration },
            ])
        );
    }

    const order = new Map(uniqueIds.map((id, i) => [id, i]));
    return rows
        .map((s) => {
            const cfg = staffConfigs.get(s.id);
            return {
                id: s.id,
                name: s.name,
                category: s.category,
                price: cfg?.custom_price ?? s.price,
                duration_minutes: cfg?.custom_duration ?? s.duration_minutes,
            };
        })
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function setsEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
}

export type BundleMatch = {
    bundle_id: string;
    bundle_name: string;
    service_ids: string[];
    sum_price: number;
    combo_price: number;
    combo_savings: number;
};

export async function findBestBundleMatch(
    serviceIds: string[],
    policy: PricingPolicy,
    scope: { shop_id?: string | null; barber_id?: string | null }
): Promise<BundleMatch | null> {
    if (serviceIds.length < policy.min_combo_services) return null;

    const where: Record<string, unknown> = { is_active: true };
    if (scope.shop_id) where.shop_id = scope.shop_id;
    else if (scope.barber_id) where.barber_id = scope.barber_id;
    else return null;

    const bundles = await prisma.service_bundles.findMany({
        where,
        include: { items: true },
    });

    const lines = await resolveServiceLines(serviceIds);
    const sumPrice = lines.reduce((s, l) => s + l.price, 0);

    let best: BundleMatch | null = null;
    for (const bundle of bundles) {
        const bundleServiceIds = bundle.items.map((i) => i.service_id);
        if (!setsEqual(serviceIds, bundleServiceIds)) continue;

        try {
            const comboPrice = computeBundleFinalPrice(sumPrice, bundle, policy);
            const savings = Math.round((sumPrice - comboPrice) * 100) / 100;
            const candidate: BundleMatch = {
                bundle_id: bundle.id,
                bundle_name: bundle.name,
                service_ids: bundleServiceIds,
                sum_price: sumPrice,
                combo_price: comboPrice,
                combo_savings: savings,
            };
            if (!best || candidate.combo_price < best.combo_price) {
                best = candidate;
            }
        } catch {
            /* skip invalid bundle config */
        }
    }
    return best;
}

export type BundleOfferSummary = {
    bundle_id: string;
    bundle_name: string;
    service_ids: string[];
    services: ResolvedServiceLine[];
    full_sum_price: number;
    combo_price: number;
    savings: number;
};

export type NearMissBundleOffer = BundleOfferSummary & {
    missing_service_ids: string[];
    missing_services: ResolvedServiceLine[];
    selected_sum_price: number;
    add_on_price: number;
};

export type PromoOfferSummary = {
    id: string;
    code: string;
    discount_text: string;
    title: string;
    type: 'shop' | 'platform';
};

export type BookingOffersResult = {
    promotions: PromoOfferSummary[];
    matched_bundle: BundleMatch | null;
    near_miss_bundles: NearMissBundleOffer[];
    available_bundles: BundleOfferSummary[];
};

export function isSubsetOf(selected: string[], bundleServiceIds: string[]): boolean {
    const bundleSet = new Set(bundleServiceIds);
    return selected.length > 0 && selected.every((id) => bundleSet.has(id));
}

async function summarizeBundleOffer(
    bundle: Pick<service_bundles, 'id' | 'name' | 'bundle_price' | 'discount_type' | 'discount_value'>,
    bundleServiceIds: string[],
    policy: PricingPolicy,
    shopMemberId?: string | null
): Promise<BundleOfferSummary | null> {
    try {
        const lines = await resolveServiceLines(bundleServiceIds, { shop_member_id: shopMemberId });
        const fullSum = Math.round(lines.reduce((s, l) => s + l.price, 0) * 100) / 100;
        const comboPrice = computeBundleFinalPrice(fullSum, bundle, policy);
        const savings = Math.round((fullSum - comboPrice) * 100) / 100;
        return {
            bundle_id: bundle.id,
            bundle_name: bundle.name,
            service_ids: bundleServiceIds,
            services: lines,
            full_sum_price: fullSum,
            combo_price: comboPrice,
            savings,
        };
    } catch {
        return null;
    }
}

export async function getBookingOffers(input: {
    service_ids: string[];
    shop_id?: string | null;
    barber_id?: string | null;
    shop_member_id?: string | null;
}): Promise<BookingOffersResult> {
    const policy = await getActivePricingPolicy();
    const selectedIds = [...new Set(input.service_ids)];

    let shopId = input.shop_id ?? null;
    if (!shopId && input.barber_id) {
        const barber = await prisma.barbers.findUnique({
            where: { id: input.barber_id },
            select: { shop_id: true },
        });
        shopId = barber?.shop_id ?? null;
    }

    const promoScope = shopId ? { OR: [{ shop_id: shopId }, { shop_id: null }] } : { shop_id: null };
    const promoRows = await prisma.promo_codes.findMany({
        where: { AND: [{ is_active: true }, promoScope] },
        orderBy: { code: 'asc' },
    });
    const promotions: PromoOfferSummary[] = promoRows.map((r) => ({
        id: r.id,
        code: r.code,
        discount_text: r.discount_type === 'percentage' ? `${r.discount_value}% off` : `$${r.discount_value} off`,
        title: r.shop_id ? 'Shop offer' : 'Platform offer',
        type: r.shop_id ? 'shop' : 'platform',
    }));

    const scope = { shop_id: shopId, barber_id: input.barber_id ?? null };
    if (!scope.shop_id && !scope.barber_id) {
        return { promotions, matched_bundle: null, near_miss_bundles: [], available_bundles: [] };
    }

    const where: Record<string, unknown> = { is_active: true };
    if (scope.shop_id) where.shop_id = scope.shop_id;
    else if (scope.barber_id) where.barber_id = scope.barber_id;

    const bundles = await prisma.service_bundles.findMany({
        where,
        include: { items: true },
        orderBy: { name: 'asc' },
    });

    const matched_bundle =
        selectedIds.length >= policy.min_combo_services
            ? await findBestBundleMatch(selectedIds, policy, scope)
            : null;

    const near_miss_bundles: NearMissBundleOffer[] = [];
    const available_bundles: BundleOfferSummary[] = [];
    const selectedSet = new Set(selectedIds);

    for (const bundle of bundles) {
        const bundleServiceIds = bundle.items.map((i) => i.service_id);
        if (setsEqual(selectedIds, bundleServiceIds)) continue;

        const summary = await summarizeBundleOffer(bundle, bundleServiceIds, policy, input.shop_member_id);
        if (!summary) continue;

        if (selectedIds.length === 0) {
            available_bundles.push(summary);
            continue;
        }

        const missing = bundleServiceIds.filter((id) => !selectedSet.has(id));
        if (!isSubsetOf(selectedIds, bundleServiceIds) || missing.length === 0 || missing.length > 2) continue;

        const selectedLines = summary.services.filter((s) => selectedSet.has(s.id));
        const missingLines = summary.services.filter((s) => missing.includes(s.id));
        const selectedSum = Math.round(selectedLines.reduce((s, l) => s + l.price, 0) * 100) / 100;
        const addOnPrice = Math.round(missingLines.reduce((s, l) => s + l.price, 0) * 100) / 100;

        near_miss_bundles.push({
            ...summary,
            missing_service_ids: missing,
            missing_services: missingLines,
            selected_sum_price: selectedSum,
            add_on_price: addOnPrice,
        });
    }

    near_miss_bundles.sort((a, b) => b.savings - a.savings);
    available_bundles.sort((a, b) => b.savings - a.savings);

    return {
        promotions,
        matched_bundle,
        near_miss_bundles: near_miss_bundles.slice(0, 5),
        available_bundles: available_bundles.slice(0, 6),
    };
}

export type BookingQuoteInput = {
    service_ids: string[];
    barber_id: string;
    shop_id?: string | null;
    shop_member_id?: string | null;
    user_id?: string | null;
    promo_code?: string | null;
    context_type?: 'shop' | 'independent';
};

export type BookingQuoteResult = {
    services: ResolvedServiceLine[];
    sum_price: number;
    subtotal_after_combo: number;
    bundle: BundleMatch | null;
    promo: {
        code: string;
        discount_amount: number;
        discount_text: string;
    } | null;
    discount_amount: number;
    combo_savings: number;
    final_price: number;
    total_duration_minutes: number;
    policy: PricingPolicy;
};

export async function calculateBookingQuote(input: BookingQuoteInput): Promise<BookingQuoteResult> {
    const policy = await getActivePricingPolicy();
    const serviceIds = [...new Set(input.service_ids)];
    if (serviceIds.length === 0) throw new Error('At least one service is required');

    const lines = await resolveServiceLines(serviceIds, {
        barber_id: input.barber_id,
        shop_member_id: input.shop_member_id,
    });

    for (const line of lines) {
        validateServicePrice(line.price, policy);
    }

    const sumPrice = Math.round(lines.reduce((s, l) => s + l.price, 0) * 100) / 100;
    const totalDuration = lines.reduce((s, l) => s + l.duration_minutes, 0);

    const bundle = await findBestBundleMatch(serviceIds, policy, {
        shop_id: input.shop_id,
        barber_id: input.barber_id,
    });

    const subtotalAfterCombo = bundle ? bundle.combo_price : sumPrice;
    const comboSavings = bundle ? bundle.combo_savings : 0;

    let promoDiscount = 0;
    let promoInfo: BookingQuoteResult['promo'] = null;
    const code = input.promo_code?.trim().toUpperCase();
    if (code && input.user_id) {
        const v = await validatePromoCode({
            code,
            barber_id: input.barber_id,
            shop_id: input.shop_id ?? null,
            base_price: subtotalAfterCombo,
            user_id: input.user_id,
            context_type: input.context_type ?? (input.shop_id ? 'shop' : 'independent'),
            skip_audit: true,
        });
        if (v.status !== 'VALID') throw new Error(v.message);
        promoDiscount = v.discount_amount ?? 0;
        promoInfo = {
            code,
            discount_amount: promoDiscount,
            discount_text: v.discount_text ?? '',
        };
    }

    const totalDiscount = Math.round((comboSavings + promoDiscount) * 100) / 100;
    const finalPrice = Math.max(0, Math.round((subtotalAfterCombo - promoDiscount) * 100) / 100);

    return {
        services: lines,
        sum_price: sumPrice,
        subtotal_after_combo: subtotalAfterCombo,
        bundle,
        promo: promoInfo,
        discount_amount: totalDiscount,
        combo_savings: comboSavings,
        final_price: finalPrice,
        total_duration_minutes: totalDuration,
        policy,
    };
}

export function validateBundleWriteInput(input: {
    name?: string;
    service_ids?: string[];
    bundle_price?: number | null;
    discount_type?: string | null;
    discount_value?: number | null;
    policy?: PricingPolicy;
}): { name: string; service_ids: string[]; bundle_price: number | null; discount_type: string | null; discount_value: number | null } {
    const policy = input.policy ?? DEFAULT_POLICY;
    const name = (input.name || '').trim();
    if (name.length < 2 || name.length > 80) throw new Error('Bundle name must be 2-80 characters');

    const serviceIds = [...new Set(input.service_ids || [])];
    if (serviceIds.length < policy.min_combo_services) {
        throw new Error(`A combo must include at least ${policy.min_combo_services} services`);
    }

    const hasFixed = input.bundle_price != null && Number.isFinite(Number(input.bundle_price));
    const hasPct = input.discount_type === 'percentage' && input.discount_value != null;
    const hasFixedOff = input.discount_type === 'fixed' && input.discount_value != null;

    if (!hasFixed && !hasPct && !hasFixedOff) {
        throw new Error('Set a combo price or a percentage/fixed discount off the service sum');
    }

    if (hasPct) {
        const pct = Number(input.discount_value);
        if (pct <= 0 || pct > policy.max_combo_discount_percent) {
            throw new Error(`Combo percentage discount must be between 0 and ${policy.max_combo_discount_percent}%`);
        }
    }

    return {
        name,
        service_ids: serviceIds,
        bundle_price: hasFixed ? Number(input.bundle_price) : null,
        discount_type: hasPct || hasFixedOff ? String(input.discount_type) : null,
        discount_value: hasPct || hasFixedOff ? Number(input.discount_value) : null,
    };
}

export async function validateBundleAgainstServices(
    serviceIds: string[],
    bundlePrice: number | null,
    discountType: string | null,
    discountValue: number | null,
    policy: PricingPolicy
): Promise<void> {
    const lines = await resolveServiceLines(serviceIds);
    const sum = lines.reduce((s, l) => s + l.price, 0);
    computeBundleFinalPrice(
        sum,
        {
            bundle_price: bundlePrice,
            discount_type: discountType,
            discount_value: discountValue,
        },
        policy
    );
}
