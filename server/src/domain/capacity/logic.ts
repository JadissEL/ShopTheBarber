import { addMinutes } from 'date-fns';
import { prisma } from '../../db/prisma';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getBarberBufferMinutes(barberId: string): Promise<number> {
    const settings = await prisma.barber_capacity_settings.findUnique({
        where: { barber_id: barberId },
    });
    return settings?.default_buffer_minutes ?? 0;
}

export async function resolveChairForBooking(params: {
    shopId?: string | null;
    barberId: string;
    chairId?: string | null;
    startDatetime: Date;
}): Promise<string | null> {
    if (!params.shopId) return null;

    const chairs = await prisma.shop_chairs.findMany({
        where: { shop_id: params.shopId, is_active: true },
        orderBy: { sort_order: 'asc' },
    });

    if (chairs.length === 0) return null;

    if (params.chairId) {
        const match = chairs.find((c) => c.id === params.chairId);
        if (!match) throw new Error('Selected chair is not available');
        return match.id;
    }

    const dayOfWeek = DAYS[params.startDatetime.getDay()];
    const assignments = await prisma.chair_assignments.findMany({
        where: {
            barber_id: params.barberId,
            chair_id: { in: chairs.map((c) => c.id) },
            OR: [{ day_of_week: null }, { day_of_week: dayOfWeek }],
        },
    });

    const assignedChairIds = new Set(assignments.map((a) => a.chair_id));
    const candidateChairs =
        assignedChairIds.size > 0 ? chairs.filter((c) => assignedChairIds.has(c.id)) : chairs;

    return candidateChairs[0]?.id ?? chairs[0].id;
}

export async function countChairConflicts(params: {
    chairId: string;
    startDatetime: Date;
    durationMinutes: number;
    bufferMinutes: number;
    excludeBookingId?: string;
}): Promise<number> {
    const endWithBuffer = addMinutes(params.startDatetime, params.durationMinutes + params.bufferMinutes);
    const startIso = params.startDatetime.toISOString();
    const endIso = endWithBuffer.toISOString();

    return prisma.bookings.count({
        where: {
            chair_id: params.chairId,
            status: { notIn: ['cancelled', 'no_show'] },
            start_time: { lt: endIso },
            end_time: { gt: startIso },
            ...(params.excludeBookingId ? { id: { not: params.excludeBookingId } } : {}),
        },
    });
}

export async function validateChairCapacity(params: {
    shopId?: string | null;
    barberId: string;
    chairId?: string | null;
    startDatetime: Date;
    durationMinutes: number;
    excludeBookingId?: string;
}): Promise<{ ok: true; chair_id: string | null } | { ok: false; message: string }> {
    if (!params.shopId) return { ok: true, chair_id: null };

    const bufferMinutes = await getBarberBufferMinutes(params.barberId);
    const chairId = await resolveChairForBooking({
        shopId: params.shopId,
        barberId: params.barberId,
        chairId: params.chairId,
        startDatetime: params.startDatetime,
    });

    if (!chairId) return { ok: true, chair_id: null };

    const conflicts = await countChairConflicts({
        chairId,
        startDatetime: params.startDatetime,
        durationMinutes: params.durationMinutes,
        bufferMinutes,
        excludeBookingId: params.excludeBookingId,
    });

    if (conflicts > 0) {
        return { ok: false, message: 'This chair is already booked for the selected time' };
    }

    return { ok: true, chair_id: chairId };
}

export async function listShopChairs(shopId: string) {
    return prisma.shop_chairs.findMany({
        where: { shop_id: shopId },
        orderBy: { sort_order: 'asc' },
        include: {
            assignments: {
                include: { barber: { select: { id: true, name: true } } },
            },
        },
    });
}

export async function upsertShopChair(
    shopId: string,
    input: { id?: string; name: string; is_active?: boolean; sort_order?: number }
) {
    if (input.id) {
        return prisma.shop_chairs.update({
            where: { id: input.id },
            data: {
                name: input.name.trim(),
                is_active: input.is_active ?? true,
                sort_order: input.sort_order ?? 0,
            },
        });
    }
    const crypto = await import('crypto');
    return prisma.shop_chairs.create({
        data: {
            id: crypto.randomUUID(),
            shop_id: shopId,
            name: input.name.trim(),
            is_active: input.is_active ?? true,
            sort_order: input.sort_order ?? 0,
        },
    });
}

export async function assignBarberToChair(input: {
    chairId: string;
    barberId: string;
    dayOfWeek?: string | null;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
}) {
    const crypto = await import('crypto');
    return prisma.chair_assignments.create({
        data: {
            id: crypto.randomUUID(),
            chair_id: input.chairId,
            barber_id: input.barberId,
            day_of_week: input.dayOfWeek ?? null,
            effective_from: input.effectiveFrom ?? null,
            effective_to: input.effectiveTo ?? null,
        },
    });
}

export async function setBarberBufferMinutes(barberId: string, minutes: number) {
    const crypto = await import('crypto');
    const safe = Math.max(0, Math.min(120, Math.floor(minutes)));
    return prisma.barber_capacity_settings.upsert({
        where: { barber_id: barberId },
        create: { id: crypto.randomUUID(), barber_id: barberId, default_buffer_minutes: safe },
        update: { default_buffer_minutes: safe },
    });
}
