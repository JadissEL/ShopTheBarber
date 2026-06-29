import { addMinutes, format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { prisma } from '../db/prisma';
import { getBarberBufferMinutes } from '../domain/capacity/logic';

function parseTimeString(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/** Interval overlap — exported for unit tests */
export function slotIntervalOverlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && aEnd > bStart;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export async function listBarberDaySlots(params: {
    barberId: string;
    shopId?: string | null;
    date: string;
    durationMinutes: number;
    contextType?: string;
    stepMinutes?: number;
}) {
    const duration = Math.max(15, params.durationMinutes || 30);
    const step = params.stepMinutes ?? 30;
    const dayStart = startOfDay(parseISO(params.date));
    if (Number.isNaN(dayStart.getTime())) {
        throw new Error('Invalid date');
    }

    const dayOfWeek = DAYS[dayStart.getDay()];
    const shopId = params.shopId ?? null;
    const contextType = params.contextType ?? (shopId ? 'shop' : 'independent');

    const shifts = await prisma.shifts.findMany({
        where: {
            barber_id: params.barberId,
            day: dayOfWeek,
            ...(contextType === 'shop' && shopId ? { shop_id: shopId } : {}),
        },
    });

    const relevantShift =
        contextType === 'shop' && shopId
            ? shifts.find((s) => s.shop_id === shopId)
            : shifts.find((s) => !s.shop_id) ?? shifts[0];

    if (shifts.length > 0 && !relevantShift) {
        return { available: [] as string[], waitlist: [] as string[], closed: true };
    }

    const startStr = relevantShift?.start_time ?? '09:00';
    const endStr = relevantShift?.end_time ?? '18:00';
    const shiftStartMin = parseTimeString(startStr);
    const shiftEndMin = parseTimeString(endStr);

    const rangeStart = dayStart.toISOString();
    const rangeEnd = endOfDay(dayStart).toISOString();

    const [bookings, timeOff, bufferMinutes] = await Promise.all([
        prisma.bookings.findMany({
            where: {
                barber_id: params.barberId,
                status: { notIn: ['cancelled', 'no_show'] },
                start_time: { gte: rangeStart, lte: rangeEnd },
            },
            select: { start_time: true, end_time: true },
        }),
        prisma.time_blocks.findMany({
            where: {
                barber_id: params.barberId,
                OR: [{ shop_id: null }, ...(shopId ? [{ shop_id: shopId }] : [])],
                start_datetime: { lte: rangeEnd },
                end_datetime: { gte: rangeStart },
            },
            select: { start_datetime: true, end_datetime: true, shop_id: true },
        }),
        getBarberBufferMinutes(params.barberId),
    ]);

    const now = new Date();
    const available: string[] = [];
    const waitlist: string[] = [];

    for (let minute = shiftStartMin; minute + duration <= shiftEndMin; minute += step) {
        const slotStart = new Date(dayStart);
        slotStart.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        const slotEnd = addMinutes(slotStart, duration + bufferMinutes);

        if (slotStart < now) continue;

        const timeLabel = format(slotStart, 'h:mm a', { locale: enUS });

        const blocked = timeOff.some((block) => {
            const isRelevant = !block.shop_id || block.shop_id === shopId;
            if (!isRelevant) return false;
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            return slotIntervalOverlaps(slotStart, slotEnd, blockStart, blockEnd);
        });

        if (blocked) continue;

        const taken = bookings.some((b) => {
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);
            return slotIntervalOverlaps(slotStart, slotEnd, bStart, bEnd);
        });

        if (taken) {
            waitlist.push(timeLabel);
        } else {
            available.push(timeLabel);
        }
    }

    return { available, waitlist, closed: false };
}
