import { prisma } from '../db/prisma';
import {
    promoAppliesToShop,
    resolveAudience,
} from '../promotions/targeting';
import { listGroupBookingBarbers } from '../groupBooking/logic';
import { getBatchPublicBarberStats } from '../providerStats/logic';
import { listFeaturedHomeReviews } from '../reviews/logic';
import { enrichProducts } from '../marketplace/logic';

function isPromoActive(row: { is_active: boolean | null; expiry_date: string | null }): boolean {
    if (row.is_active === false) return false;
    if (row.expiry_date) {
        const exp = new Date(row.expiry_date).getTime();
        if (!Number.isNaN(exp) && exp < Date.now()) return false;
    }
    return true;
}

function promoSortScore(discount_type: string, discount_value: number): number {
    if (discount_type === 'percentage') return discount_value;
    return discount_value / 10;
}

function promoDiscountText(discount_type: string, discount_value: number): string {
    if (discount_type === 'percentage') return `${discount_value}% off`;
    return `€${discount_value} off`;
}

function bundleDiscountText(
    discount_type: string | null | undefined,
    discount_value: number | null | undefined,
    bundle_price: number | null | undefined
): string {
    if (bundle_price != null) return `From €${bundle_price}`;
    if (discount_type === 'percentage' && discount_value != null) return `${discount_value}% off combo`;
    if (discount_type === 'fixed' && discount_value != null) return `€${discount_value} off combo`;
    return 'Combo deal';
}

type TopBarberRow = {
    id: string;
    name: string;
    image_url: string | null;
    rating: number | null;
    review_count: number | null;
    location: string | null;
    city: string | null;
};

type BarberHomeOffer = {
    id: string;
    kind: 'bundle' | 'highlight';
    scope: 'barber';
    code: null;
    title: string;
    description: string;
    discount_text: string;
    barber_id: string | null;
    barber_name: string | null;
    barber_image_url: string | null;
    rating: number | null;
    review_count: number | null;
};

type BarberBundleRow = {
    id: string;
    name: string;
    description: string | null;
    discount_type: string | null;
    discount_value: number | null;
    bundle_price: number | null;
    barber_id: string | null;
    barber: { id: string; name: string; image_url: string | null } | null;
};

async function buildBarberHomeOffers(
    bundles: BarberBundleRow[],
    topBarbers: TopBarberRow[]
): Promise<BarberHomeOffer[]> {
    const fromBundles: BarberHomeOffer[] = bundles.map((b) => ({
        id: b.id,
        kind: 'bundle' as const,
        scope: 'barber' as const,
        code: null,
        title: b.name,
        description: b.description ?? `Special from ${b.barber?.name ?? 'your barber'}`,
        discount_text: bundleDiscountText(b.discount_type, b.discount_value, b.bundle_price),
        barber_id: b.barber_id,
        barber_name: b.barber?.name ?? null,
        barber_image_url: b.barber?.image_url ?? null,
        rating: null as number | null,
        review_count: null as number | null,
    }));

    if (fromBundles.length >= 2) return fromBundles.slice(0, 8);

    const barberIds = topBarbers.slice(0, 8).map((b) => b.id);
    if (barberIds.length === 0) return fromBundles;

    const services = await prisma.services.findMany({
        where: { barber_id: { in: barberIds } },
        orderBy: [{ price: 'asc' }, { name: 'asc' }],
        select: {
            id: true,
            barber_id: true,
            name: true,
            price: true,
            category: true,
        },
    });

    const servicesByBarber = new Map<string, typeof services>();
    for (const service of services) {
        if (!service.barber_id) continue;
        const list = servicesByBarber.get(service.barber_id) ?? [];
        list.push(service);
        servicesByBarber.set(service.barber_id, list);
    }

    const highlights: BarberHomeOffer[] = [];
    for (const barber of topBarbers) {
        const barberServices = servicesByBarber.get(barber.id);
        if (!barberServices?.length) continue;

        const starter = barberServices[0];
        const comboLabel =
            barberServices.length >= 2
                ? `${starter.name}, ${barberServices[1].name}`
                : starter.name;
        const location = barber.city || barber.location || 'Independent stylist';

        highlights.push({
            id: `highlight-${barber.id}`,
            kind: 'highlight' as const,
            scope: 'barber' as const,
            code: null,
            title: barber.name,
            description: `${comboLabel}, ${location}`,
            discount_text: `From €${Math.round(starter.price)}`,
            barber_id: barber.id,
            barber_name: barber.name,
            barber_image_url: barber.image_url,
            rating: barber.rating ?? null,
            review_count: barber.review_count ?? null,
        });

        if (fromBundles.length + highlights.length >= 4) break;
    }

    return [...fromBundles, ...highlights].slice(0, 8);
}

export async function getHomepageContent() {
    const activeBarberWhere = { OR: [{ status: 'active' as const }, { status: null }] };

    const [
        topBarbers,
        platformPromos,
        shopPromos,
        barberBundles,
        shopBundles,
        mobileBarbers,
        vipGroupBarbers,
        featuredReviews,
        featuredProducts,
        latestArticles,
        barberCount,
        mobileBarberCount,
        productCount,
        activePromoCount,
    ] = await Promise.all([
            prisma.barbers.findMany({
                where: { OR: [{ status: 'active' }, { status: null }] },
                orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
                take: 6,
                select: {
                    id: true,
                    name: true,
                    title: true,
                    image_url: true,
                    rating: true,
                    review_count: true,
                    location: true,
                    city: true,
                    shop_id: true,
                    skills: true,
                    offers_mobile_service: true,
                    offers_shop_service: true,
                },
            }),
            prisma.promo_codes.findMany({
                where: { is_active: true, shop_id: null },
                orderBy: { code: 'asc' },
                take: 16,
                include: { targets: true },
            }),
            prisma.promo_codes.findMany({
                where: { is_active: true, shop_id: { not: null } },
                orderBy: { code: 'asc' },
                take: 16,
                include: { shop: { select: { id: true, name: true, image_url: true, location: true } }, targets: true },
            }),
            prisma.service_bundles.findMany({
                where: { is_active: true, barber_id: { not: null } },
                orderBy: { name: 'asc' },
                take: 8,
                include: { barber: { select: { id: true, name: true, image_url: true } } },
            }),
            prisma.service_bundles.findMany({
                where: { is_active: true, shop_id: { not: null } },
                orderBy: { name: 'asc' },
                take: 8,
                include: { shop: { select: { id: true, name: true, image_url: true, location: true } } },
            }),
            prisma.barbers.findMany({
                where: {
                    offers_mobile_service: true,
                    OR: [{ status: 'active' }, { status: null }],
                },
                orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
                take: 12,
                select: {
                    id: true,
                    name: true,
                    title: true,
                    image_url: true,
                    rating: true,
                    review_count: true,
                    location: true,
                    city: true,
                    offers_mobile_service: true,
                    offers_shop_service: true,
                    is_vip: true,
                },
            }),
            listGroupBookingBarbers(4),
            listFeaturedHomeReviews(6),
            prisma.products
                .findMany({
                    where: { status: 'published', published: true },
                    orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
                    take: 6,
                })
                .then((rows) => enrichProducts(rows)),
            prisma.articles.findMany({
                where: { status: 'published', published: true },
                orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
                take: 3,
                select: {
                    id: true,
                    title: true,
                    excerpt: true,
                    category: true,
                    image_url: true,
                    slug: true,
                    created_at: true,
                },
            }),
            prisma.barbers.count({ where: activeBarberWhere }),
            prisma.barbers.count({
                where: {
                    offers_mobile_service: true,
                    OR: [{ status: 'active' }, { status: null }],
                },
            }),
            prisma.products.count({ where: { status: 'published', published: true } }),
            prisma.promo_codes.count({ where: { is_active: true } }),
        ]);

    const activePlatformPromos = platformPromos
        .filter(isPromoActive)
        .filter((p) => {
            const aud = resolveAudience(p);
            return aud === 'everyone' || aud === 'all_barbers' || aud === 'all_shops';
        })
        .sort(
        (a, b) => promoSortScore(b.discount_type, b.discount_value) - promoSortScore(a.discount_type, a.discount_value)
    );
    const activeShopPromos = shopPromos
        .filter(isPromoActive)
        .filter((p) => p.shop_id && promoAppliesToShop(p.shop_id, p))
        .sort(
        (a, b) => promoSortScore(b.discount_type, b.discount_value) - promoSortScore(a.discount_type, a.discount_value)
    );

    const shopOffers = [
        ...activeShopPromos.map((p) => ({
            id: p.id,
            kind: 'promo' as const,
            scope: 'shop' as const,
            code: p.code,
            title: p.shop?.name ? `${p.shop.name} offer` : 'Shop offer',
            description: p.shop?.location ?? 'Limited time at this barbershop',
            discount_text: promoDiscountText(p.discount_type, p.discount_value),
            sort_score: promoSortScore(p.discount_type, p.discount_value),
            shop_id: p.shop_id,
            shop_name: p.shop?.name ?? null,
            shop_image_url: p.shop?.image_url ?? null,
        })),
        ...shopBundles.map((b) => ({
            id: b.id,
            kind: 'bundle' as const,
            scope: 'shop' as const,
            code: null,
            title: b.name,
            description: b.description ?? `Combo at ${b.shop?.name ?? 'shop'}`,
            discount_text: bundleDiscountText(b.discount_type, b.discount_value, b.bundle_price),
            sort_score: b.bundle_price != null ? 50 : promoSortScore(b.discount_type ?? 'fixed', b.discount_value ?? 0),
            shop_id: b.shop_id,
            shop_name: b.shop?.name ?? null,
            shop_image_url: b.shop?.image_url ?? null,
        })),
    ]
        .sort((a, b) => b.sort_score - a.sort_score)
        .slice(0, 8)
        .map(({ sort_score: _s, ...rest }) => rest);

    const barberIdsForStats = [
        ...new Set([
            ...topBarbers.map((b) => b.id),
            ...mobileBarbers.slice(0, 4).map((b) => b.id),
        ]),
    ];
    const publicStats = await getBatchPublicBarberStats(barberIdsForStats);

    const barberOffers = await buildBarberHomeOffers(barberBundles, topBarbers);

    return {
        top_barbers: topBarbers.map((b) => ({
            id: b.id,
            name: b.name,
            title: b.title ?? 'Professional Barber',
            image_url: b.image_url,
            rating: b.rating ?? 0,
            review_count: b.review_count ?? 0,
            location: b.city || b.location || 'Your area',
            shop_id: b.shop_id,
            offers_mobile_service: b.offers_mobile_service ?? false,
            offers_shop_service: b.offers_shop_service !== false,
            completed_services: publicStats[b.id]?.completed_services ?? 0,
        })),
        offers: {
            platform: activePlatformPromos.map((p) => ({
                id: p.id,
                kind: 'promo' as const,
                scope: 'platform' as const,
                code: p.code,
                title: 'ShopTheBarber exclusive',
                description: 'Platform-wide savings on your next booking',
                discount_text: promoDiscountText(p.discount_type, p.discount_value),
                discount_type: p.discount_type,
                discount_value: p.discount_value,
            })),
            shops: shopOffers,
            barbers: barberOffers,
        },
        mobile_barbers: mobileBarbers
            .sort((a, b) => {
                const score = (row: typeof a) => {
                    let s = 0;
                    if (row.offers_shop_service === false) s += 4;
                    if (row.is_vip === true) s += 2;
                    return s;
                };
                return score(b) - score(a) || (b.rating ?? 0) - (a.rating ?? 0);
            })
            .slice(0, 4)
            .map((b) => ({
            id: b.id,
            name: b.name,
            title: b.title ?? 'Mobile barber',
            image_url: b.image_url,
            rating: b.rating ?? 0,
            review_count: b.review_count ?? 0,
            location: b.city || b.location || 'Your area',
            offers_mobile_service: b.offers_mobile_service ?? false,
            offers_shop_service: b.offers_shop_service !== false,
            is_vip: b.is_vip === true,
            mobile_only: b.offers_shop_service === false && b.offers_mobile_service === true,
            completed_services: publicStats[b.id]?.completed_services ?? 0,
        })),
        vip_group_barbers: vipGroupBarbers,
        group_booking: {
            headline: 'Group grooming',
            description:
                'Book groomsmen, friends, and family in one session, at the shop or at home. One account covers the whole party; guests do not need their own profile.',
            cta_path: 'Explore?group=1',
            explore_path: 'Explore?group=1',
        },
        home_visit: {
            headline: 'Your barber, at your door',
            description:
                'Choose certified professionals, including VIP at-home specialists, who come to your home, office, or hotel. Same quality as the chair, zero travel.',
            cta_path: 'Explore?mobile=1',
            group_cta_path: 'Explore?mobile=1&group=1',
        },
        stats: {
            barber_count: barberCount,
            mobile_barber_count: mobileBarberCount,
            product_count: productCount,
            offer_count: activePromoCount + barberBundles.length + shopBundles.length,
        },
        featured_reviews: featuredReviews,
        featured_products: featuredProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            image_url: p.image_url,
            vendor_name: p.vendor_name ?? null,
        })),
        latest_articles: latestArticles.map((a) => ({
            id: a.id,
            title: a.title,
            excerpt: a.excerpt,
            category: a.category,
            image_url: a.image_url,
            slug: a.slug,
            created_at: a.created_at,
        })),
    };
}
