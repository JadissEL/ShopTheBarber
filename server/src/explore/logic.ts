import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { promoAppliesToShop, resolveAudience } from '../promotions/targeting';
import {
    barberServicesMatchExploreFilter,
    buildShopIdsByService,
    normalizeExploreFilterTag,
} from './serviceTags';

const ACTIVE_BARBER_WHERE: Prisma.barbersWhereInput = {
    OR: [{ status: 'active' }, { status: null }],
};

const RELAXATION_STEPS: Array<{ key: keyof ExploreSearchParams; value: unknown; label: string }> = [
    { key: 'highlight', value: '', label: 'highlight filter' },
    { key: 'city', value: '', label: 'city' },
    { key: 'kids', value: false, label: 'kids welcome' },
    { key: 'mobile', value: false, label: 'mobile visits' },
    { key: 'shop', value: false, label: 'in-shop only' },
    { key: 'group', value: false, label: 'group booking' },
    { key: 'language', value: '', label: 'language' },
    { key: 'service', value: 'All', label: 'service type' },
    { key: 'q', value: '', label: 'search' },
];

export type ExploreSearchParams = {
    q?: string;
    city?: string;
    service?: string;
    language?: string;
    kids?: boolean;
    mobile?: boolean;
    shop?: boolean;
    group?: boolean;
    highlight?: string;
    limit?: number;
    offset?: number;
};

export type ExploreBarberRow = {
    id: string;
    name: string;
    title: string | null;
    image_url: string | null;
    rating: number;
    review_count: number;
    location: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    shop_id: string | null;
    offers_mobile_service: boolean;
    offers_shop_service: boolean;
    offers_group_booking: boolean;
    group_booking_discount_percent: number;
    is_vip: boolean;
    spoken_languages: string | null;
    children_friendly: boolean;
    attestation_licensed: boolean;
    attestation_insured: boolean;
    services: string[];
    min_price: number | null;
    shop?: {
        id: string;
        name: string;
        spoken_languages: string | null;
        children_friendly: boolean | null;
        attestation_licensed: boolean | null;
        attestation_insured: boolean | null;
    } | null;
};

function parseSkills(skills: string | null | undefined): string[] {
    if (!skills) return [];
    try {
        const parsed = JSON.parse(skills);
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
    } catch {
        return [];
    }
}

function isFilterActive(key: keyof ExploreSearchParams, value: unknown): boolean {
    switch (key) {
        case 'highlight':
        case 'city':
        case 'language':
        case 'q':
            return typeof value === 'string' && value.trim().length > 0;
        case 'kids':
        case 'mobile':
        case 'shop':
        case 'group':
            return value === true;
        case 'service':
            return typeof value === 'string' && value !== '' && value !== 'All';
        default:
            return false;
    }
}

function buildExploreFallbackMessage(relaxedLabels: string[]): string {
    if (!relaxedLabels.length) {
        return "We couldn't find exact matches, but here are some great professionals nearby.";
    }
    const unique = [...new Set(relaxedLabels)];
    if (unique.length === 1) {
        return `No exact matches with your ${unique[0]} filter — here are nearby professionals you may like.`;
    }
    return `We couldn't find exact matches with all your filters — showing nearby professionals with a broader search.`;
}

function barberMatchesHighlight(barber: ExploreBarberRow, highlight?: string): boolean {
    if (!highlight) return true;
    if (highlight === 'topRated') {
        return (barber.rating ?? 0) >= 4.5 && (barber.review_count ?? 0) >= 5;
    }
    if (highlight === 'new') {
        return (barber.review_count ?? 0) === 0 && (barber.rating ?? 0) === 0;
    }
    if (highlight === 'trending') {
        return (barber.review_count ?? 0) >= 15 && (barber.rating ?? 0) >= 4.0;
    }
    return true;
}

function parseSpokenLanguages(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
    } catch {
        return [];
    }
}

function matchesLanguageFilter(
    barberLangs: string | null | undefined,
    shopLangs: string | null | undefined,
    language: string
): boolean {
    if (!language) return true;
    const codes = new Set([
        ...parseSpokenLanguages(barberLangs),
        ...parseSpokenLanguages(shopLangs),
    ]);
    return codes.has(language);
}

function barberMatchesServiceFilter(
    barber: ExploreBarberRow,
    service: string | undefined,
    shopIdsByService: Record<string, Set<string>>,
    dealShopIds: Set<string>,
    hasPlatformPromos: boolean
): boolean {
    if (!service || service === 'All') return true;

    if (service === 'Deals') {
        return hasPlatformPromos || (!!barber.shop_id && dealShopIds.has(barber.shop_id));
    }

    const tagNorm = normalizeExploreFilterTag(service);
    const tagKey = service.toLowerCase().replace(/\s+/g, '');
    const shopIds = (tagNorm && shopIdsByService[tagNorm]) || shopIdsByService[tagKey];
    const matchesByShop = !!(barber.shop_id && shopIds?.has(barber.shop_id));
    const matchesByServices = barberServicesMatchExploreFilter(barber.services, service);
    return matchesByShop || matchesByServices;
}

function barberMatchesParams(
    barber: ExploreBarberRow,
    params: ExploreSearchParams,
    shopIdsByService: Record<string, Set<string>>,
    dealShopIds: Set<string>,
    hasPlatformPromos: boolean
): boolean {
    const q = (params.q || '').trim().toLowerCase();
    if (q) {
        const haystack = [
            barber.name,
            barber.location,
            barber.title,
            barber.city,
            ...barber.services,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        if (!haystack.includes(q)) return false;
    }

    const city = (params.city || '').trim().toLowerCase();
    if (city) {
        const loc = `${barber.city || ''} ${barber.location || ''}`.toLowerCase();
        if (!loc.includes(city)) return false;
    }

    if (params.mobile && !barber.offers_mobile_service) return false;
    if (params.shop && barber.offers_shop_service === false) return false;
    if (params.group && !barber.offers_group_booking) return false;

    if (params.kids) {
        const shopFriendly = barber.shop?.children_friendly === true;
        if (!barber.children_friendly && !shopFriendly) return false;
    }

    if (!matchesLanguageFilter(barber.spoken_languages, barber.shop?.spoken_languages, params.language || '')) {
        return false;
    }

    if (!barberMatchesServiceFilter(barber, params.service, shopIdsByService, dealShopIds, hasPlatformPromos)) {
        return false;
    }

    if (!barberMatchesHighlight(barber, params.highlight)) return false;

    return true;
}

function serializeBarber(
    row: {
        id: string;
        name: string;
        title: string | null;
        image_url: string | null;
        rating: number | null;
        review_count: number | null;
        location: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        shop_id: string | null;
        skills: string | null;
        offers_mobile_service: boolean | null;
        offers_shop_service: boolean | null;
        offers_group_booking: boolean | null;
        group_booking_discount_percent: number | null;
        is_vip: boolean | null;
        spoken_languages: string | null;
        children_friendly: boolean | null;
        attestation_licensed: boolean | null;
        attestation_insured: boolean | null;
        shop: {
            id: string;
            name: string;
            spoken_languages: string | null;
            children_friendly: boolean | null;
            attestation_licensed: boolean | null;
            attestation_insured: boolean | null;
        } | null;
    },
    serviceNames: string[],
    minPrice: number | null = null
): ExploreBarberRow {
    const skills = parseSkills(row.skills);
    const services = [...new Set([...skills, ...serviceNames])];
    return {
        id: row.id,
        name: row.name,
        title: row.title,
        image_url: row.image_url,
        rating: row.rating ?? 0,
        review_count: row.review_count ?? 0,
        location: row.location,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        shop_id: row.shop_id,
        offers_mobile_service: row.offers_mobile_service === true,
        offers_shop_service: row.offers_shop_service !== false,
        offers_group_booking: row.offers_group_booking === true,
        group_booking_discount_percent: row.group_booking_discount_percent ?? 0,
        is_vip: row.is_vip === true,
        spoken_languages: row.spoken_languages,
        children_friendly: row.children_friendly === true,
        attestation_licensed: row.attestation_licensed === true,
        attestation_insured: row.attestation_insured === true,
        services,
        min_price: minPrice,
        shop: row.shop,
    };
}

function buildMinPriceByBarber(
    barbers: Array<{ id: string; shop_id: string | null }>,
    barberServices: Array<{ barber_id: string | null; price: number }>,
    shopServices: Array<{ shop_id: string | null; price: number }>
): Map<string, number> {
    const shopToBarbers = new Map<string, string[]>();
    for (const barber of barbers) {
        if (!barber.shop_id) continue;
        const list = shopToBarbers.get(barber.shop_id) ?? [];
        list.push(barber.id);
        shopToBarbers.set(barber.shop_id, list);
    }

    const minByBarber = new Map<string, number>();

    const applyPrice = (barberId: string, price: number) => {
        if (!Number.isFinite(price)) return;
        const current = minByBarber.get(barberId);
        if (current == null || price < current) minByBarber.set(barberId, price);
    };

    for (const svc of barberServices) {
        if (svc.barber_id) applyPrice(svc.barber_id, svc.price);
    }

    for (const svc of shopServices) {
        if (!svc.shop_id) continue;
        const targets = shopToBarbers.get(svc.shop_id) ?? [];
        for (const barberId of targets) applyPrice(barberId, svc.price);
    }

    return minByBarber;
}

async function loadDealContext() {
    const promos = await prisma.promo_codes.findMany({
        where: { is_active: true },
        include: { targets: true },
        take: 100,
    });

    const now = Date.now();
    const active = promos.filter((p) => {
        if (p.is_active === false) return false;
        if (p.expiry_date) {
            const exp = new Date(p.expiry_date).getTime();
            if (!Number.isNaN(exp) && exp < now) return false;
        }
        return true;
    });

    const dealShopIds = new Set<string>();
    let hasPlatformPromos = false;

    for (const p of active) {
        const aud = resolveAudience(p);
        if (aud === 'everyone' || aud === 'all_barbers' || aud === 'all_shops') {
            hasPlatformPromos = true;
        }
        if (p.shop_id && promoAppliesToShop(p.shop_id, p)) {
            dealShopIds.add(p.shop_id);
        }
    }

    return { dealShopIds, hasPlatformPromos };
}

function buildPrismaWhere(params: ExploreSearchParams): Prisma.barbersWhereInput {
    const and: Prisma.barbersWhereInput[] = [ACTIVE_BARBER_WHERE];

    if (params.mobile) and.push({ offers_mobile_service: true });
    if (params.shop) and.push({ offers_shop_service: true });
    if (params.group) and.push({ offers_group_booking: true });

    const q = (params.q || '').trim();
    if (q) {
        and.push({
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
            ],
        });
    }

    const city = (params.city || '').trim();
    if (city) {
        and.push({
            OR: [
                { city: { contains: city, mode: 'insensitive' } },
                { location: { contains: city, mode: 'insensitive' } },
            ],
        });
    }

    if (params.kids) {
        and.push({
            OR: [{ children_friendly: true }, { shop: { children_friendly: true } }],
        });
    }

    const language = (params.language || '').trim();
    if (language) {
        and.push({
            OR: [
                { spoken_languages: { contains: `"${language}"` } },
                { shop: { spoken_languages: { contains: `"${language}"` } } },
            ],
        });
    }

    if (params.highlight === 'topRated') {
        and.push({ rating: { gte: 4.5 }, review_count: { gte: 5 } });
    } else if (params.highlight === 'new') {
        and.push({ review_count: 0, rating: 0 });
    } else if (params.highlight === 'trending') {
        and.push({ review_count: { gte: 15 }, rating: { gte: 4.0 } });
    }

    return { AND: and };
}

async function loadExploreBarbers(params: ExploreSearchParams): Promise<ExploreBarberRow[]> {
    const where = buildPrismaWhere(params);
    const take = Math.min(Math.max(params.limit ?? 500, 1), 500);
    const skip = Math.max(params.offset ?? 0, 0);

    const rows = await prisma.barbers.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take,
        skip,
        select: {
            id: true,
            name: true,
            title: true,
            image_url: true,
            rating: true,
            review_count: true,
            location: true,
            city: true,
            latitude: true,
            longitude: true,
            shop_id: true,
            skills: true,
            offers_mobile_service: true,
            offers_shop_service: true,
            offers_group_booking: true,
            group_booking_discount_percent: true,
            is_vip: true,
            spoken_languages: true,
            children_friendly: true,
            attestation_licensed: true,
            attestation_insured: true,
            shop: {
                select: {
                    id: true,
                    name: true,
                    spoken_languages: true,
                    children_friendly: true,
                    attestation_licensed: true,
                    attestation_insured: true,
                },
            },
        },
    });

    const barberIds = rows.map((r) => r.id);
    const shopIds = [...new Set(rows.map((r) => r.shop_id).filter(Boolean))] as string[];

    const [barberServices, shopServices] = await Promise.all([
        barberIds.length
            ? prisma.services.findMany({
                  where: { barber_id: { in: barberIds } },
                  select: { barber_id: true, name: true, price: true },
              })
            : Promise.resolve([]),
        shopIds.length
            ? prisma.services.findMany({
                  where: { shop_id: { in: shopIds } },
                  select: { shop_id: true, name: true, category: true, price: true },
              })
            : Promise.resolve([]),
    ]);

    const namesByBarber = new Map<string, string[]>();
    for (const svc of barberServices) {
        if (!svc.barber_id) continue;
        const list = namesByBarber.get(svc.barber_id) ?? [];
        list.push(svc.name);
        namesByBarber.set(svc.barber_id, list);
    }

    const minPriceByBarber = buildMinPriceByBarber(rows, barberServices, shopServices);

    return rows.map((row) =>
        serializeBarber(row, namesByBarber.get(row.id) ?? [], minPriceByBarber.get(row.id) ?? null)
    );
}

function filterBarbersInMemory(
    barbers: ExploreBarberRow[],
    params: ExploreSearchParams,
    shopIdsByService: Record<string, Set<string>>,
    dealShopIds: Set<string>,
    hasPlatformPromos: boolean
): ExploreBarberRow[] {
    return barbers.filter((b) => barberMatchesParams(b, params, shopIdsByService, dealShopIds, hasPlatformPromos));
}

export async function searchExploreBarbers(params: ExploreSearchParams) {
    const [allServices, dealContext] = await Promise.all([
        prisma.services.findMany({
            select: { shop_id: true, name: true, category: true },
            take: 5000,
        }),
        loadDealContext(),
    ]);

    const shopIdsByService = buildShopIdsByService(allServices);
    const candidates = await loadExploreBarbers(params);
    const barbers = filterBarbersInMemory(
        candidates,
        params,
        shopIdsByService,
        dealContext.dealShopIds,
        dealContext.hasPlatformPromos
    );

    let fallback: { barbers: ExploreBarberRow[]; relaxedLabels: string[]; message: string } | null = null;

    const hasActiveFilters = RELAXATION_STEPS.some((step) => isFilterActive(step.key, params[step.key]));
    if (barbers.length === 0 && hasActiveFilters) {
        const relaxedParams = { ...params };
        const dropped: string[] = [];

        for (const step of RELAXATION_STEPS) {
            if (!isFilterActive(step.key, params[step.key])) continue;
            relaxedParams[step.key] = step.value as never;
            dropped.push(step.label);

            const relaxedCandidates = await loadExploreBarbers(relaxedParams);
            const relaxedResults = filterBarbersInMemory(
                relaxedCandidates,
                relaxedParams,
                shopIdsByService,
                dealContext.dealShopIds,
                dealContext.hasPlatformPromos
            );

            if (relaxedResults.length > 0) {
                const sorted = [...relaxedResults].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                fallback = {
                    barbers: sorted.slice(0, 12),
                    relaxedLabels: dropped,
                    message: buildExploreFallbackMessage(dropped),
                };
                break;
            }
        }
    }

    return {
        barbers,
        total: barbers.length,
        fallback,
    };
}

export function parseExploreSearchQuery(query: Record<string, string | undefined>): ExploreSearchParams {
    const bool = (v?: string) => v === '1' || v === 'true';
    return {
        q: query.q?.trim() || undefined,
        city: query.city?.trim() || undefined,
        service: query.service?.trim() || undefined,
        language: query.language?.trim() || undefined,
        kids: bool(query.kids),
        mobile: bool(query.mobile),
        shop: bool(query.shop),
        group: bool(query.group),
        highlight: query.highlight?.trim() || undefined,
        limit: query.limit ? Math.min(parseInt(query.limit, 10) || 500, 500) : undefined,
        offset: query.offset ? Math.max(parseInt(query.offset, 10) || 0, 0) : undefined,
    };
}

export type ExploreShopSearchParams = {
    q?: string;
    city?: string;
    language?: string;
    kids?: boolean;
    limit?: number;
    offset?: number;
};

export type ExploreShopRow = {
    id: string;
    name: string;
    location: string | null;
    image_url: string | null;
    description: string | null;
    rating: number;
    review_count: number;
    spoken_languages: string | null;
    children_friendly: boolean;
    attestation_licensed: boolean;
    attestation_insured: boolean;
    offers_shop_service: boolean;
};

function buildShopPrismaWhere(params: ExploreShopSearchParams): Prisma.shopsWhereInput {
    const and: Prisma.shopsWhereInput[] = [{ offers_shop_service: { not: false } }];

    const q = (params.q || '').trim();
    if (q) {
        and.push({
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ],
        });
    }

    const city = (params.city || '').trim();
    if (city) {
        and.push({ location: { contains: city, mode: 'insensitive' } });
    }

    if (params.kids) {
        and.push({ children_friendly: true });
    }

    const language = (params.language || '').trim();
    if (language) {
        and.push({ spoken_languages: { contains: `"${language}"` } });
    }

    return { AND: and };
}

function serializeShop(row: {
    id: string;
    name: string;
    location: string | null;
    image_url: string | null;
    description: string | null;
    rating: number | null;
    review_count: number | null;
    spoken_languages: string | null;
    children_friendly: boolean | null;
    attestation_licensed: boolean | null;
    attestation_insured: boolean | null;
    offers_shop_service: boolean | null;
}): ExploreShopRow {
    return {
        id: row.id,
        name: row.name,
        location: row.location,
        image_url: row.image_url,
        description: row.description,
        rating: row.rating ?? 0,
        review_count: row.review_count ?? 0,
        spoken_languages: row.spoken_languages,
        children_friendly: row.children_friendly === true,
        attestation_licensed: row.attestation_licensed === true,
        attestation_insured: row.attestation_insured === true,
        offers_shop_service: row.offers_shop_service !== false,
    };
}

export async function searchExploreShops(params: ExploreShopSearchParams) {
    const where = buildShopPrismaWhere(params);
    const take = Math.min(Math.max(params.limit ?? 200, 1), 200);
    const skip = Math.max(params.offset ?? 0, 0);

    const rows = await prisma.shops.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take,
        skip,
        select: {
            id: true,
            name: true,
            location: true,
            image_url: true,
            description: true,
            rating: true,
            review_count: true,
            spoken_languages: true,
            children_friendly: true,
            attestation_licensed: true,
            attestation_insured: true,
            offers_shop_service: true,
        },
    });

    const shops = rows.map(serializeShop);
    return { shops, total: shops.length };
}

export function parseExploreShopQuery(query: Record<string, string | undefined>): ExploreShopSearchParams {
    const bool = (v?: string) => v === '1' || v === 'true';
    return {
        q: query.q?.trim() || undefined,
        city: query.city?.trim() || undefined,
        language: query.language?.trim() || undefined,
        kids: bool(query.kids),
        limit: query.limit ? Math.min(parseInt(query.limit, 10) || 200, 200) : undefined,
        offset: query.offset ? Math.max(parseInt(query.offset, 10) || 0, 0) : undefined,
    };
}
