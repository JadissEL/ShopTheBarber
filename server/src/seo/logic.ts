import { prisma } from '../db/prisma';
import { SEO_CITIES, getCityBySlug, type SeoCity } from './cities';

const SITE_ORIGIN = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://shop-the-barber.vercel.app';

function barberCityWhere(city: SeoCity) {
    return {
        AND: [
            { OR: [{ status: 'active' }, { status: null }] },
            {
                OR: [
                    { city: { equals: city.name, mode: 'insensitive' as const } },
                    { location: { contains: city.name, mode: 'insensitive' as const } },
                ],
            },
        ],
    };
}

export async function listPublicCities() {
    const counts = await Promise.all(
        SEO_CITIES.map(async (city) => {
            const barber_count = await prisma.barbers.count({ where: barberCityWhere(city) });
            return {
                slug: city.slug,
                name: city.name,
                region: city.region,
                country: city.country,
                country_name: city.country_name,
                headline: city.headline,
                barber_count,
                url: `${SITE_ORIGIN}/barbers-in/${city.slug}`,
            };
        })
    );
    return { cities: counts.sort((a, b) => b.barber_count - a.barber_count || a.name.localeCompare(b.name)) };
}

export async function getCityLanding(slug: string) {
    const city = getCityBySlug(slug);
    if (!city) return null;

    const [barbers, mobile_count, barber_count, shop_rows] = await Promise.all([
        prisma.barbers.findMany({
            where: barberCityWhere(city),
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
                offers_group_booking: true,
                is_vip: true,
                shop_id: true,
            },
        }),
        prisma.barbers.count({
            where: {
                ...barberCityWhere(city),
                offers_mobile_service: true,
            },
        }),
        prisma.barbers.count({ where: barberCityWhere(city) }),
        prisma.shops.findMany({
            where: {
                OR: [
                    { location: { contains: city.name, mode: 'insensitive' } },
                ],
            },
            take: 6,
            select: { id: true, name: true, location: true, image_url: true, rating: true, review_count: true },
            orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        }),
    ]);

    return {
        city: {
            ...city,
            url: `${SITE_ORIGIN}/barbers-in/${city.slug}`,
        },
        stats: {
            barber_count,
            mobile_barber_count: mobile_count,
            shop_count: shop_rows.length,
        },
        barbers,
        shops: shop_rows,
    };
}

export async function buildSitemapXml(): Promise<string> {
    const staticPaths = [
        '',
        'Explore',
        'Blog',
        'Marketplace',
        'cities',
        'About',
        'HelpCenter',
    ];
    const urls: string[] = staticPaths.map((p) => {
        const loc = p ? `${SITE_ORIGIN}/${p}` : `${SITE_ORIGIN}/`;
        return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>`;
    });
    for (const city of SEO_CITIES) {
        urls.push(
            `<url><loc>${SITE_ORIGIN}/barbers-in/${city.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`
        );
    }

    const barbers = await prisma.barbers.findMany({
        where: { OR: [{ status: 'active' }, { status: null }] },
        select: { id: true, updated_at: true },
        take: 500,
        orderBy: { rating: 'desc' },
    });
    for (const barber of barbers) {
        urls.push(
            `<url><loc>${SITE_ORIGIN}/BarberProfile?id=${encodeURIComponent(barber.id)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );
    }

    const shops = await prisma.shops.findMany({ select: { id: true }, take: 200 });
    for (const shop of shops) {
        urls.push(
            `<url><loc>${SITE_ORIGIN}/ShopProfile?id=${encodeURIComponent(shop.id)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}
