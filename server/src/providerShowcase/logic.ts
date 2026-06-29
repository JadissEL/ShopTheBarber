import { prisma } from '../db/prisma';
import { randomUUID } from 'crypto';

export const CAREER_ENTRY_TYPES = [
    'education',
    'employment',
    'certification',
    'milestone',
    'award',
] as const;

export type CareerEntryType = (typeof CAREER_ENTRY_TYPES)[number];

export type CareerEntryDto = {
    id: string;
    entry_type: string;
    title: string;
    organization: string | null;
    location: string | null;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    is_current: boolean;
    sort_order: number;
};

export type ShowcasePortfolioItem = {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
};

export type PortfolioItemDto = ShowcasePortfolioItem & {
    status: string | null;
};

export type PublicShowcase = {
    provider_type: 'barber' | 'shop';
    profile_created_at: string | null;
    member_since_label: string | null;
    years_experience: number | null;
    career_started_year: number | null;
    mobile_service_started_year: number | null;
    founded_year: number | null;
    instagram_handle: string | null;
    tiktok_handle: string | null;
    website_url: string | null;
    profile_highlights: string[];
    career_timeline: CareerEntryDto[];
    portfolio: ShowcasePortfolioItem[];
    auto_milestones: { label: string; year: string | null; detail: string | null }[];
};

function parseHighlights(raw: string | null | undefined): string[] {
    if (!raw?.trim()) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        }
    } catch {
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

function serializeHighlights(items: string[] | undefined): string | null {
    if (!items?.length) return null;
    return JSON.stringify(items.filter(Boolean));
}

function formatMemberSince(createdAt: string | null | undefined): string | null {
    if (!createdAt) return null;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function mapCareerEntry(row: {
    id: string;
    entry_type: string;
    title: string;
    organization: string | null;
    location: string | null;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    is_current: boolean | null;
    sort_order: number | null;
}): CareerEntryDto {
    return {
        id: row.id,
        entry_type: row.entry_type,
        title: row.title,
        organization: row.organization,
        location: row.location,
        description: row.description,
        started_at: row.started_at,
        ended_at: row.ended_at,
        is_current: row.is_current === true,
        sort_order: row.sort_order ?? 0,
    };
}

function buildAutoMilestones(params: {
    created_at: string | null;
    career_started_year: number | null;
    mobile_service_started_year: number | null;
    founded_year: number | null;
    offers_mobile_service: boolean;
    shop_name: string | null;
}): PublicShowcase['auto_milestones'] {
    const items: PublicShowcase['auto_milestones'] = [];
    const memberSince = formatMemberSince(params.created_at);
    if (memberSince) {
        items.push({
            label: 'Joined ShopTheBarber',
            year: params.created_at ? String(new Date(params.created_at).getFullYear()) : null,
            detail: `Profile active since ${memberSince}`,
        });
    }
    if (params.career_started_year) {
        items.push({
            label: 'Started grooming career',
            year: String(params.career_started_year),
            detail: null,
        });
    }
    if (params.founded_year && params.shop_name) {
        items.push({
            label: `Opened ${params.shop_name}`,
            year: String(params.founded_year),
            detail: null,
        });
    } else if (params.founded_year) {
        items.push({
            label: 'Shop established',
            year: String(params.founded_year),
            detail: null,
        });
    }
    if (params.offers_mobile_service && params.mobile_service_started_year) {
        items.push({
            label: 'Started mobile / at-home service',
            year: String(params.mobile_service_started_year),
            detail: 'Travels to clients',
        });
    }
    return items;
}

async function loadPortfolio(barberId: string): Promise<ShowcasePortfolioItem[]> {
    const videos = await prisma.barber_videos.findMany({
        where: {
            barber_id: barberId,
            OR: [{ status: 'approved' }, { status: 'active' }, { status: null }],
        },
        orderBy: { created_at: 'desc' },
        take: 24,
        select: { id: true, title: true, thumbnail_url: true, video_url: true },
    });
    return videos.map(mapPortfolioItem);
}

function mapPortfolioItem(v: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
    status?: string | null;
}): PortfolioItemDto {
    return {
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        video_url: v.video_url,
        status: v.status ?? null,
    };
}

async function assertBarberOwnership(userId: string): Promise<string> {
    const ctx = await resolveProviderContext(userId);
    if (!ctx.barberId) throw new Error('Barber profile required');
    return ctx.barberId;
}

async function assertPortfolioAccess(userId: string, videoId: string) {
    const barberId = await assertBarberOwnership(userId);
    const video = await prisma.barber_videos.findUnique({ where: { id: videoId } });
    if (!video) throw new Error('Portfolio item not found');
    if (video.barber_id !== barberId) throw new Error('Unauthorized');
    return video;
}

export async function getPublicBarberShowcase(barberId: string): Promise<PublicShowcase | null> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: {
            created_at: true,
            years_experience: true,
            career_started_year: true,
            mobile_service_started_year: true,
            instagram_handle: true,
            tiktok_handle: true,
            website_url: true,
            profile_highlights: true,
            offers_mobile_service: true,
            shop: { select: { name: true, founded_year: true } },
            career_entries: { orderBy: [{ sort_order: 'asc' }, { started_at: 'desc' }] },
        },
    });
    if (!barber) return null;

    const portfolio = await loadPortfolio(barberId);

    return {
        provider_type: 'barber',
        profile_created_at: barber.created_at,
        member_since_label: formatMemberSince(barber.created_at),
        years_experience: barber.years_experience,
        career_started_year: barber.career_started_year,
        mobile_service_started_year: barber.mobile_service_started_year,
        founded_year: barber.shop?.founded_year ?? null,
        instagram_handle: barber.instagram_handle,
        tiktok_handle: barber.tiktok_handle,
        website_url: barber.website_url,
        profile_highlights: parseHighlights(barber.profile_highlights),
        career_timeline: barber.career_entries.map(mapCareerEntry),
        portfolio,
        auto_milestones: buildAutoMilestones({
            created_at: barber.created_at,
            career_started_year: barber.career_started_year,
            mobile_service_started_year: barber.mobile_service_started_year,
            founded_year: barber.shop?.founded_year ?? null,
            offers_mobile_service: barber.offers_mobile_service === true,
            shop_name: barber.shop?.name ?? null,
        }),
    };
}

export async function getPublicShopShowcase(shopId: string): Promise<PublicShowcase | null> {
    const shop = await prisma.shops.findUnique({
        where: { id: shopId },
        select: {
            created_at: true,
            founded_year: true,
            phone: true,
            website_url: true,
            instagram_handle: true,
            profile_highlights: true,
            offers_mobile_service: true,
            name: true,
            career_entries: { orderBy: [{ sort_order: 'asc' }, { started_at: 'desc' }] },
        },
    });
    if (!shop) return null;

    return {
        provider_type: 'shop',
        profile_created_at: shop.created_at,
        member_since_label: formatMemberSince(shop.created_at),
        years_experience: null,
        career_started_year: null,
        mobile_service_started_year: null,
        founded_year: shop.founded_year,
        instagram_handle: shop.instagram_handle,
        tiktok_handle: null,
        website_url: shop.website_url,
        profile_highlights: parseHighlights(shop.profile_highlights),
        career_timeline: shop.career_entries.map(mapCareerEntry),
        portfolio: [],
        auto_milestones: buildAutoMilestones({
            created_at: shop.created_at,
            career_started_year: null,
            mobile_service_started_year: null,
            founded_year: shop.founded_year,
            offers_mobile_service: shop.offers_mobile_service === true,
            shop_name: shop.name,
        }),
    };
}

export async function resolveProviderContext(userId: string) {
    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true, shop_id: true },
    });
    const ownedShop = await prisma.shops.findFirst({
        where: { owner_id: userId },
        select: { id: true },
    });
    const memberShop =
        barber?.shop_id &&
        (await prisma.shop_members.findFirst({
            where: {
                barber_id: barber.id,
                shop_id: barber.shop_id,
                role: { in: ['owner', 'manager'] },
            },
            select: { shop_id: true },
        }));
    return {
        barberId: barber?.id ?? null,
        shopId: ownedShop?.id ?? memberShop?.shop_id ?? null,
    };
}

export async function getMyShowcase(userId: string) {
    const ctx = await resolveProviderContext(userId);
    const [barber, shop, barberEntries, shopEntries] = await Promise.all([
        ctx.barberId
            ? prisma.barbers.findUnique({
                  where: { id: ctx.barberId },
                  select: {
                      id: true,
                      name: true,
                      title: true,
                      bio: true,
                      image_url: true,
                      skills: true,
                      years_experience: true,
                      career_started_year: true,
                      mobile_service_started_year: true,
                      instagram_handle: true,
                      tiktok_handle: true,
                      website_url: true,
                      profile_highlights: true,
                      created_at: true,
                      offers_mobile_service: true,
                  },
              })
            : null,
        ctx.shopId
            ? prisma.shops.findUnique({
                  where: { id: ctx.shopId },
                  select: {
                      id: true,
                      name: true,
                      description: true,
                      founded_year: true,
                      phone: true,
                      website_url: true,
                      instagram_handle: true,
                      profile_highlights: true,
                      created_at: true,
                  },
              })
            : null,
        ctx.barberId
            ? prisma.provider_career_entries.findMany({
                  where: { barber_id: ctx.barberId },
                  orderBy: [{ sort_order: 'asc' }, { started_at: 'desc' }],
              })
            : [],
        ctx.shopId
            ? prisma.provider_career_entries.findMany({
                  where: { shop_id: ctx.shopId },
                  orderBy: [{ sort_order: 'asc' }, { started_at: 'desc' }],
              })
            : [],
    ]);

    const portfolio =
        ctx.barberId != null
            ? (
                  await prisma.barber_videos.findMany({
                      where: { barber_id: ctx.barberId },
                      orderBy: { created_at: 'desc' },
                      select: {
                          id: true,
                          title: true,
                          thumbnail_url: true,
                          video_url: true,
                          status: true,
                      },
                  })
              ).map(mapPortfolioItem)
            : [];

    return {
        barber: barber
            ? {
                  ...barber,
                  profile_highlights: parseHighlights(barber.profile_highlights),
                  career_entries: barberEntries.map(mapCareerEntry),
                  portfolio,
              }
            : null,
        shop: shop
            ? {
                  ...shop,
                  profile_highlights: parseHighlights(shop.profile_highlights),
                  career_entries: shopEntries.map(mapCareerEntry),
              }
            : null,
    };
}

export async function updateMyBarberShowcase(
    userId: string,
    data: {
        name?: string;
        title?: string;
        bio?: string;
        image_url?: string;
        skills?: string[];
        years_experience?: number | null;
        career_started_year?: number | null;
        mobile_service_started_year?: number | null;
        instagram_handle?: string | null;
        tiktok_handle?: string | null;
        website_url?: string | null;
        profile_highlights?: string[];
    }
) {
    const ctx = await resolveProviderContext(userId);
    if (!ctx.barberId) throw new Error('Barber profile required');

    const skills =
        data.skills !== undefined
            ? data.skills.length
                ? JSON.stringify(data.skills)
                : null
            : undefined;

    return prisma.barbers.update({
        where: { id: ctx.barberId },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.title !== undefined && { title: data.title || 'Professional Barber' }),
            ...(data.bio !== undefined && { bio: data.bio || null }),
            ...(data.image_url !== undefined && { image_url: data.image_url || null }),
            ...(skills !== undefined && { skills }),
            ...(data.years_experience !== undefined && { years_experience: data.years_experience }),
            ...(data.career_started_year !== undefined && { career_started_year: data.career_started_year }),
            ...(data.mobile_service_started_year !== undefined && {
                mobile_service_started_year: data.mobile_service_started_year,
            }),
            ...(data.instagram_handle !== undefined && {
                instagram_handle: data.instagram_handle?.replace(/^@/, '') || null,
            }),
            ...(data.tiktok_handle !== undefined && {
                tiktok_handle: data.tiktok_handle?.replace(/^@/, '') || null,
            }),
            ...(data.website_url !== undefined && { website_url: data.website_url || null }),
            ...(data.profile_highlights !== undefined && {
                profile_highlights: serializeHighlights(data.profile_highlights),
            }),
            updated_at: new Date().toISOString(),
        },
    });
}

export async function updateMyShopShowcase(
    userId: string,
    data: {
        description?: string;
        founded_year?: number | null;
        phone?: string | null;
        website_url?: string | null;
        instagram_handle?: string | null;
        profile_highlights?: string[];
    }
) {
    const ctx = await resolveProviderContext(userId);
    if (!ctx.shopId) throw new Error('Shop profile required');

    const membership = await prisma.shop_members.findFirst({
        where: {
            shop_id: ctx.shopId,
            OR: [{ user_id: userId }, { barber: { user_id: userId } }],
            role: { in: ['owner', 'manager'] },
        },
    });
    const shop = await prisma.shops.findUnique({ where: { id: ctx.shopId }, select: { owner_id: true } });
    if (!membership && shop?.owner_id !== userId) {
        throw new Error('Shop manager access required');
    }

    return prisma.shops.update({
        where: { id: ctx.shopId },
        data: {
            ...(data.description !== undefined && { description: data.description || null }),
            ...(data.founded_year !== undefined && { founded_year: data.founded_year }),
            ...(data.phone !== undefined && { phone: data.phone || null }),
            ...(data.website_url !== undefined && { website_url: data.website_url || null }),
            ...(data.instagram_handle !== undefined && {
                instagram_handle: data.instagram_handle?.replace(/^@/, '') || null,
            }),
            ...(data.profile_highlights !== undefined && {
                profile_highlights: serializeHighlights(data.profile_highlights),
            }),
            updated_at: new Date().toISOString(),
        },
    });
}

function assertEntryType(type: string): CareerEntryType {
    if (!CAREER_ENTRY_TYPES.includes(type as CareerEntryType)) {
        throw new Error(`Invalid entry type. Use: ${CAREER_ENTRY_TYPES.join(', ')}`);
    }
    return type as CareerEntryType;
}

export async function createCareerEntry(
    userId: string,
    data: {
        scope: 'barber' | 'shop';
        entry_type: string;
        title: string;
        organization?: string;
        location?: string;
        description?: string;
        started_at?: string;
        ended_at?: string;
        is_current?: boolean;
        sort_order?: number;
    }
) {
    const ctx = await resolveProviderContext(userId);
    const entryType = assertEntryType(data.entry_type);

    if (data.scope === 'barber') {
        if (!ctx.barberId) throw new Error('Barber profile required');
        const row = await prisma.provider_career_entries.create({
            data: {
                id: randomUUID(),
                barber_id: ctx.barberId,
                entry_type: entryType,
                title: data.title.trim(),
                organization: data.organization?.trim() || null,
                location: data.location?.trim() || null,
                description: data.description?.trim() || null,
                started_at: data.started_at?.trim() || null,
                ended_at: data.ended_at?.trim() || null,
                is_current: data.is_current === true,
                sort_order: data.sort_order ?? 0,
            },
        });
        return mapCareerEntry(row);
    }

    if (!ctx.shopId) throw new Error('Shop profile required');
    const row = await prisma.provider_career_entries.create({
        data: {
            id: randomUUID(),
            shop_id: ctx.shopId,
            entry_type: entryType,
            title: data.title.trim(),
            organization: data.organization?.trim() || null,
            location: data.location?.trim() || null,
            description: data.description?.trim() || null,
            started_at: data.started_at?.trim() || null,
            ended_at: data.ended_at?.trim() || null,
            is_current: data.is_current === true,
            sort_order: data.sort_order ?? 0,
        },
    });
    return mapCareerEntry(row);
}

async function assertCareerEntryAccess(userId: string, entryId: string) {
    const entry = await prisma.provider_career_entries.findUnique({ where: { id: entryId } });
    if (!entry) throw new Error('Career entry not found');

    if (entry.barber_id) {
        const barber = await prisma.barbers.findUnique({
            where: { id: entry.barber_id },
            select: { user_id: true },
        });
        if (barber?.user_id !== userId) throw new Error('Unauthorized');
        return entry;
    }

    if (entry.shop_id) {
        const shop = await prisma.shops.findUnique({
            where: { id: entry.shop_id },
            select: { owner_id: true },
        });
        if (shop?.owner_id === userId) return entry;
        const member = await prisma.shop_members.findFirst({
            where: {
                shop_id: entry.shop_id,
                OR: [{ user_id: userId }, { barber: { user_id: userId } }],
                role: { in: ['owner', 'manager'] },
            },
        });
        if (!member) throw new Error('Unauthorized');
    }

    return entry;
}

export async function updateCareerEntry(
    userId: string,
    entryId: string,
    data: Partial<{
        entry_type: string;
        title: string;
        organization: string;
        location: string;
        description: string;
        started_at: string;
        ended_at: string;
        is_current: boolean;
        sort_order: number;
    }>
) {
    await assertCareerEntryAccess(userId, entryId);
    const row = await prisma.provider_career_entries.update({
        where: { id: entryId },
        data: {
            ...(data.entry_type !== undefined && { entry_type: assertEntryType(data.entry_type) }),
            ...(data.title !== undefined && { title: data.title.trim() }),
            ...(data.organization !== undefined && { organization: data.organization?.trim() || null }),
            ...(data.location !== undefined && { location: data.location?.trim() || null }),
            ...(data.description !== undefined && { description: data.description?.trim() || null }),
            ...(data.started_at !== undefined && { started_at: data.started_at?.trim() || null }),
            ...(data.ended_at !== undefined && { ended_at: data.ended_at?.trim() || null }),
            ...(data.is_current !== undefined && { is_current: data.is_current }),
            ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
            updated_at: new Date().toISOString(),
        },
    });
    return mapCareerEntry(row);
}

export async function deleteCareerEntry(userId: string, entryId: string) {
    await assertCareerEntryAccess(userId, entryId);
    await prisma.provider_career_entries.delete({ where: { id: entryId } });
    return { ok: true };
}

export async function createPortfolioItem(
    userId: string,
    data: { title: string; video_url: string; thumbnail_url?: string | null }
) {
    const barberId = await assertBarberOwnership(userId);
    if (!data.title?.trim()) throw new Error('Title is required');
    if (!data.video_url?.trim()) throw new Error('Video or image URL is required');

    const row = await prisma.barber_videos.create({
        data: {
            id: randomUUID(),
            barber_id: barberId,
            title: data.title.trim(),
            video_url: data.video_url.trim(),
            thumbnail_url: data.thumbnail_url?.trim() || null,
            status: 'active',
        },
        select: { id: true, title: true, thumbnail_url: true, video_url: true, status: true },
    });
    return mapPortfolioItem(row);
}

export async function updatePortfolioItem(
    userId: string,
    videoId: string,
    data: Partial<{ title: string; video_url: string; thumbnail_url: string | null; status: string }>
) {
    await assertPortfolioAccess(userId, videoId);
    const row = await prisma.barber_videos.update({
        where: { id: videoId },
        data: {
            ...(data.title !== undefined && { title: data.title.trim() }),
            ...(data.video_url !== undefined && { video_url: data.video_url.trim() }),
            ...(data.thumbnail_url !== undefined && {
                thumbnail_url: data.thumbnail_url?.trim() || null,
            }),
            ...(data.status !== undefined && { status: data.status }),
        },
        select: { id: true, title: true, thumbnail_url: true, video_url: true, status: true },
    });
    return mapPortfolioItem(row);
}

export async function deletePortfolioItem(userId: string, videoId: string) {
    await assertPortfolioAccess(userId, videoId);
    await prisma.barber_videos.delete({ where: { id: videoId } });
    return { ok: true };
}

import {
    computeBarberShowcaseCompleteness,
    computeShopShowcaseCompleteness,
    type ShowcaseCompleteness,
} from './completeness';

export async function getMyShowcaseCompleteness(userId: string): Promise<{
    barber: ShowcaseCompleteness | null;
    shop: ShowcaseCompleteness | null;
}> {
    const data = await getMyShowcase(userId);
    return {
        barber: data.barber
            ? computeBarberShowcaseCompleteness({
                  bio: data.barber.bio,
                  profile_highlights: data.barber.profile_highlights,
                  career_entries: data.barber.career_entries,
                  portfolio: data.barber.portfolio,
                  years_experience: data.barber.years_experience,
                  career_started_year: data.barber.career_started_year,
              })
            : null,
        shop: data.shop
            ? computeShopShowcaseCompleteness({
                  description: data.shop.description,
                  profile_highlights: data.shop.profile_highlights,
                  career_entries: data.shop.career_entries,
                  founded_year: data.shop.founded_year,
              })
            : null,
    };
}

export { parseHighlights, formatMemberSince };
