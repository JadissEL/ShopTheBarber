import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './prisma';
import { coordsForLocationText } from '../lib/geocoding/locationCoords';

export type QaProfile = {
    id: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
    label?: string;
    account_type?: string;
    barber_id?: string;
    shop_id?: string;
    shop_name?: string;
    shop_location?: string;
    title?: string;
    location?: string;
    is_vip?: boolean;
    offers_group_booking?: boolean;
    offers_mobile_service?: boolean;
    store_name?: string;
    company_id?: string;
    company_name?: string;
    pen_name?: string;
};

const SHOP_PHOTOS = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop',
];

const BARBER_PHOTOS = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0789f5ea4a?w=400&auto=format&fit=crop',
];

function loadQaProfiles(): QaProfile[] {
    const here = dirname(fileURLToPath(import.meta.url));
    const jsonPath = resolve(here, '../../../scripts/qa-profiles.json');
    return JSON.parse(readFileSync(jsonPath, 'utf8')) as QaProfile[];
}

function primaryCity(location: string): string {
    return location.split(',')[0]?.trim() || location;
}

function barberCoords(location: string, id: string) {
    return coordsForLocationText(location, id) ?? {};
}

/** Seed QA test users with barber/shop profiles for multi-role journey testing. */
export async function seedQaProfiles(): Promise<void> {
    const profiles = loadQaProfiles();
    console.log(`Creating ${profiles.length} QA profiles…`);

    const shopIds = new Set<string>();
    for (const p of profiles) {
        if (p.shop_id) shopIds.add(p.shop_id);
    }

    let shopPhotoIdx = 0;
    for (const shopId of shopIds) {
        const ownerProfile = profiles.find((p) => p.shop_id === shopId && p.shop_name);
        if (!ownerProfile?.shop_name || !ownerProfile.shop_location) continue;

        await prisma.shops.upsert({
            where: { id: shopId },
            create: {
                id: shopId,
                name: ownerProfile.shop_name,
                location: ownerProfile.shop_location,
                description: `QA demo shop — ${ownerProfile.shop_name}`,
                image_url: SHOP_PHOTOS[shopPhotoIdx % SHOP_PHOTOS.length],
            },
            update: {
                name: ownerProfile.shop_name,
                location: ownerProfile.shop_location,
            },
        });
        shopPhotoIdx += 1;
    }

    let barberPhotoIdx = 0;
    const now = new Date().toISOString();
    for (const p of profiles) {
        await prisma.users.upsert({
            where: { id: p.id },
            create: {
                id: p.id,
                email: p.email,
                full_name: p.full_name,
                role: p.role,
                account_type: p.account_type ?? null,
                account_type_locked_at: p.account_type ? now : null,
                avatar_url: BARBER_PHOTOS[barberPhotoIdx % BARBER_PHOTOS.length],
            },
            update: {
                email: p.email,
                full_name: p.full_name,
                role: p.role,
                ...(p.account_type
                    ? { account_type: p.account_type, account_type_locked_at: now }
                    : {}),
            },
        });
        barberPhotoIdx += 1;

        if (p.barber_id && p.shop_id && p.location) {
            await prisma.barbers.upsert({
                where: { id: p.barber_id },
                create: {
                    id: p.barber_id,
                    user_id: p.id,
                    shop_id: p.shop_id,
                    name: p.full_name,
                    title: p.title ?? 'Barber',
                    location: p.location,
                    city: primaryCity(p.location),
                    rating: p.is_vip ? 4.9 : 4.7,
                    review_count: p.is_vip ? 120 : 45,
                    is_vip: p.is_vip ?? false,
                    offers_group_booking: p.offers_group_booking ?? false,
                    group_booking_min_party: p.offers_group_booking ? 2 : undefined,
                    group_booking_max_party: p.offers_group_booking ? 8 : undefined,
                    group_booking_discount_percent: p.offers_group_booking ? 10 : undefined,
                    offers_mobile_service: p.offers_mobile_service ?? false,
                    status: 'active',
                    image_url: BARBER_PHOTOS[barberPhotoIdx % BARBER_PHOTOS.length],
                    ...barberCoords(p.location, p.barber_id),
                },
                update: {
                    name: p.full_name,
                    title: p.title ?? 'Barber',
                    is_vip: p.is_vip ?? false,
                    offers_group_booking: p.offers_group_booking ?? false,
                    offers_mobile_service: p.offers_mobile_service ?? false,
                    status: 'active',
                },
            });
        }

        if (p.barber_id && p.shop_id && p.role === 'barber') {
            await prisma.shop_members.upsert({
                where: { id: `sm-${p.id}` },
                create: {
                    id: `sm-${p.id}`,
                    shop_id: p.shop_id,
                    user_id: p.id,
                    barber_id: p.barber_id,
                    role: 'barber',
                    status: 'active',
                    booking_enabled: true,
                },
                update: {
                    shop_id: p.shop_id,
                    barber_id: p.barber_id,
                    status: 'active',
                    booking_enabled: true,
                },
            });
        }

        if (p.role === 'shop_owner' && p.shop_id) {
            await prisma.shops.update({
                where: { id: p.shop_id },
                data: { owner_id: p.id },
            });
            await prisma.shop_members.upsert({
                where: { id: `sm-${p.id}` },
                create: {
                    id: `sm-${p.id}`,
                    shop_id: p.shop_id,
                    user_id: p.id,
                    barber_id: p.barber_id ?? undefined,
                    role: 'owner',
                    status: 'active',
                },
                update: { role: 'owner', status: 'active', barber_id: p.barber_id ?? undefined },
            });
        }

        if (p.account_type === 'seller' && p.store_name) {
            await prisma.seller_profiles.upsert({
                where: { user_id: p.id },
                create: {
                    id: `seller-${p.id}`,
                    user_id: p.id,
                    display_name: p.store_name,
                    seller_type: 'vendor',
                },
                update: { display_name: p.store_name },
            });
        }

        if (p.account_type === 'company' && p.company_id && p.company_name) {
            await prisma.companies.upsert({
                where: { id: p.company_id },
                create: {
                    id: p.company_id,
                    name: p.company_name,
                    description: `QA demo company — ${p.company_name}`,
                },
                update: { name: p.company_name },
            });
            await prisma.company_accounts.upsert({
                where: { user_id: p.id },
                create: {
                    id: `ca-${p.id}`,
                    user_id: p.id,
                    company_id: p.company_id,
                },
                update: { company_id: p.company_id },
            });
        }

        if (p.account_type === 'blogger') {
            await prisma.author_profiles.upsert({
                where: { user_id: p.id },
                create: {
                    id: `author-${p.id}`,
                    user_id: p.id,
                    pen_name: p.pen_name ?? p.full_name,
                    bio: 'QA blogger profile for creator studio journeys.',
                },
                update: { pen_name: p.pen_name ?? p.full_name },
            });
        }
    }

    console.log('QA profiles seeded in database.');
}
