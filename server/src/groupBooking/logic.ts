import type { barbers } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { calculateBookingQuote } from '../pricing/logic';
import {
    ABSOLUTE_MAX_PARTY,
    ABSOLUTE_MIN_PARTY,
    DEFAULT_MAX_PARTY,
    DEFAULT_MIN_PARTY,
    GROUP_BOOKING_LABEL,
    MAX_GROUP_DISCOUNT_PERCENT,
    type GroupBookingCapabilities,
    type GroupGuestInput,
    VIP_AUTO_RATING_THRESHOLD,
    VIP_AUTO_REVIEW_COUNT,
} from './config';

type BarberVipFields = Pick<
    barbers,
    | 'id'
    | 'is_vip'
    | 'rating'
    | 'review_count'
    | 'offers_group_booking'
    | 'group_booking_min_party'
    | 'group_booking_max_party'
    | 'group_booking_discount_percent'
>;

export function isAdminVip(barber: Pick<barbers, 'is_vip'>): boolean {
    return barber.is_vip === true;
}

export function isEarnedVip(barber: Pick<barbers, 'rating' | 'review_count'>): boolean {
    const rating = barber.rating ?? 0;
    const reviews = barber.review_count ?? 0;
    return rating >= VIP_AUTO_RATING_THRESHOLD && reviews >= VIP_AUTO_REVIEW_COUNT;
}

export function isEffectiveVip(barber: Pick<barbers, 'is_vip' | 'rating' | 'review_count'>): boolean {
    return isAdminVip(barber) || isEarnedVip(barber);
}

export function vipSource(barber: Pick<barbers, 'is_vip' | 'rating' | 'review_count'>): 'admin' | 'earned' | null {
    if (isAdminVip(barber)) return 'admin';
    if (isEarnedVip(barber)) return 'earned';
    return null;
}

export function clampPartyBounds(barber: BarberVipFields): { min: number; max: number } {
    const min = Math.max(ABSOLUTE_MIN_PARTY, barber.group_booking_min_party ?? DEFAULT_MIN_PARTY);
    const max = Math.min(
        ABSOLUTE_MAX_PARTY,
        Math.max(min, barber.group_booking_max_party ?? DEFAULT_MAX_PARTY)
    );
    return { min, max };
}

export function clampGroupDiscount(percent: number | null | undefined): number {
    const n = percent ?? 0;
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(MAX_GROUP_DISCOUNT_PERCENT, Math.round(n * 100) / 100);
}

export function getGroupBookingCapabilities(barber: BarberVipFields): GroupBookingCapabilities {
    const vip = isEffectiveVip(barber);
    const { min, max } = clampPartyBounds(barber);
    const offers = barber.offers_group_booking === true;

    return {
        barber_id: barber.id,
        is_vip: vip,
        vip_source: vipSource(barber),
        offers_group_booking: offers,
        min_party: min,
        max_party: max,
        group_discount_percent: clampGroupDiscount(barber.group_booking_discount_percent),
        label: GROUP_BOOKING_LABEL,
    };
}

export type GroupQuoteInput = {
    barber_id: string;
    shop_id?: string | null;
    shop_member_id?: string | null;
    user_id?: string | null;
    promo_code?: string | null;
    context_type?: 'shop' | 'independent';
    service_ids: string[];
    guests: GroupGuestInput[];
    group_event_label?: string | null;
};

export type GroupQuoteGuestLine = {
    guest_name: string;
    service_ids: string[];
    subtotal: number;
    duration_minutes: number;
};

export type GroupQuoteResult = {
    guests: GroupQuoteGuestLine[];
    party_size: number;
    per_person_subtotal: number;
    group_subtotal: number;
    group_discount_percent: number;
    group_discount_amount: number;
    promo: { code: string; discount_amount: number; discount_text: string } | null;
    final_price: number;
    total_duration_minutes: number;
    capabilities: GroupBookingCapabilities;
};

function normalizeGuestNames(guests: GroupGuestInput[]): GroupGuestInput[] {
    return guests.map((g, i) => ({
        guest_name: (g.guest_name?.trim() || `Guest ${i + 1}`).slice(0, 120),
        service_ids: g.service_ids?.filter((id) => typeof id === 'string' && id.length > 0),
        notes: g.notes?.trim()?.slice(0, 500),
    }));
}

export async function loadBarberForGroupBooking(barberId: string): Promise<barbers | null> {
    return prisma.barbers.findUnique({ where: { id: barberId } });
}

export async function assertGroupBookingAllowed(barberId: string): Promise<GroupBookingCapabilities> {
    const barber = await loadBarberForGroupBooking(barberId);
    if (!barber) throw new Error('Barber not found');
    const caps = getGroupBookingCapabilities(barber);
    if (!caps.offers_group_booking) {
        throw new Error('This barber has not enabled group bookings');
    }
    return caps;
}

export async function calculateGroupBookingQuote(input: GroupQuoteInput): Promise<GroupQuoteResult> {
    const barber = await loadBarberForGroupBooking(input.barber_id);
    if (!barber) throw new Error('Barber not found');

    const caps = getGroupBookingCapabilities(barber);
    if (!caps.offers_group_booking) throw new Error('This barber has not enabled group bookings');

    const baseServiceIds = [...new Set(input.service_ids)];
    if (baseServiceIds.length === 0) throw new Error('At least one service is required');

    const guests = normalizeGuestNames(input.guests);
    if (guests.length < caps.min_party) {
        throw new Error(`Group bookings require at least ${caps.min_party} guests`);
    }
    if (guests.length > caps.max_party) {
        throw new Error(`Maximum party size for this barber is ${caps.max_party}`);
    }

    const guestLines: GroupQuoteGuestLine[] = [];
    let groupSubtotal = 0;
    let totalDuration = 0;

    for (const guest of guests) {
        const serviceIds = guest.service_ids?.length ? guest.service_ids : baseServiceIds;
        const quote = await calculateBookingQuote({
            service_ids: serviceIds,
            barber_id: input.barber_id,
            shop_id: input.shop_id ?? null,
            shop_member_id: input.shop_member_id ?? null,
            user_id: input.user_id,
            promo_code: null,
            context_type: input.context_type,
        });
        guestLines.push({
            guest_name: guest.guest_name,
            service_ids: serviceIds,
            subtotal: quote.final_price,
            duration_minutes: quote.total_duration_minutes,
        });
        groupSubtotal += quote.final_price;
        totalDuration += quote.total_duration_minutes;
    }

    groupSubtotal = Math.round(groupSubtotal * 100) / 100;
    const perPerson = guestLines.length > 0 ? Math.round((groupSubtotal / guestLines.length) * 100) / 100 : 0;

    const discountPct = caps.group_discount_percent;
    const groupDiscountAmount = Math.round(groupSubtotal * (discountPct / 100) * 100) / 100;
    let afterGroupDiscount = Math.max(0, Math.round((groupSubtotal - groupDiscountAmount) * 100) / 100);

    let promoInfo: GroupQuoteResult['promo'] = null;
    const code = input.promo_code?.trim().toUpperCase();
    if (code && input.user_id) {
        const { validatePromoCode } = await import('../logic/promoCode');
        const v = await validatePromoCode({
            code,
            barber_id: input.barber_id,
            shop_id: input.shop_id ?? null,
            base_price: afterGroupDiscount,
            user_id: input.user_id,
            context_type: input.context_type ?? (input.shop_id ? 'shop' : 'independent'),
            skip_audit: true,
        });
        if (v.status !== 'VALID') throw new Error(v.message);
        const promoDiscount = v.discount_amount ?? 0;
        afterGroupDiscount = Math.max(0, Math.round((afterGroupDiscount - promoDiscount) * 100) / 100);
        promoInfo = {
            code,
            discount_amount: promoDiscount,
            discount_text: v.discount_text ?? '',
        };
    }

    return {
        guests: guestLines,
        party_size: guestLines.length,
        per_person_subtotal: perPerson,
        group_subtotal: groupSubtotal,
        group_discount_percent: discountPct,
        group_discount_amount: groupDiscountAmount,
        promo: promoInfo,
        final_price: afterGroupDiscount,
        total_duration_minutes: totalDuration,
        capabilities: caps,
    };
}

export async function persistGroupGuests(
    bookingId: string,
    guests: GroupGuestInput[],
    guestLines?: GroupQuoteGuestLine[]
): Promise<void> {
    const normalized = normalizeGuestNames(guests);
    for (let i = 0; i < normalized.length; i++) {
        const g = normalized[i];
        const line = guestLines?.[i];
        const serviceIds = line?.service_ids ?? g.service_ids ?? [];
        await prisma.group_booking_guests.create({
            data: {
                id: crypto.randomUUID(),
                booking_id: bookingId,
                guest_name: g.guest_name,
                sort_order: i,
                service_ids: serviceIds.length > 0 ? JSON.stringify(serviceIds) : null,
                notes: g.notes ?? null,
            },
        });
    }
}

export async function listGroupBookingBarbers(limit = 6) {
    const barbers = await prisma.barbers.findMany({
        where: {
            offers_group_booking: true,
            OR: [{ status: 'active' }, { status: null }],
        },
        orderBy: [{ rating: 'desc' }, { review_count: 'desc' }],
        take: limit * 3,
        select: {
            id: true,
            name: true,
            title: true,
            image_url: true,
            rating: true,
            review_count: true,
            location: true,
            city: true,
            is_vip: true,
            offers_group_booking: true,
            offers_mobile_service: true,
            offers_shop_service: true,
            group_booking_min_party: true,
            group_booking_max_party: true,
            group_booking_discount_percent: true,
        },
    });

    return barbers
        .filter((b) => getGroupBookingCapabilities(b).offers_group_booking)
        .slice(0, limit)
        .map((b) => {
            const caps = getGroupBookingCapabilities(b);
            return {
                id: b.id,
                name: b.name,
                title: b.title ?? 'Professional Barber',
                image_url: b.image_url,
                rating: b.rating ?? 0,
                review_count: b.review_count ?? 0,
                location: b.city || b.location || 'Your area',
                is_vip: caps.is_vip,
                vip_source: caps.vip_source,
                offers_group_booking: true,
                offers_mobile_service: b.offers_mobile_service === true,
                offers_shop_service: b.offers_shop_service !== false,
                mobile_only: b.offers_shop_service === false && b.offers_mobile_service === true,
                min_party: caps.min_party,
                max_party: caps.max_party,
                group_discount_percent: caps.group_discount_percent,
            };
        });
}

/** @deprecated Use listGroupBookingBarbers, kept for API compatibility */
export const listVipGroupBarbers = listGroupBookingBarbers;
