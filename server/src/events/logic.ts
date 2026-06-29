import crypto from 'crypto';
import { prisma } from '../db/prisma';
import {
    EVENT_AUDIENCES,
    EVENT_FORMATS,
    EVENT_STATUSES,
    EVENT_TYPES,
    PROVIDER_ROLES,
    type EventStatus,
} from './config';

export type AuthUser = { id: string; role?: string | null; full_name?: string | null; email?: string | null };

function nowIso(): string {
    return new Date().toISOString();
}

export function isProviderRole(role?: string | null): boolean {
    return !!role && PROVIDER_ROLES.has(role);
}

export function roleMatchesAudience(role: string | null | undefined, audience: string | null | undefined): boolean {
    const aud = audience ?? 'all_providers';
    if (aud === 'all_providers') return isProviderRole(role);
    if (aud === 'barbers') return role === 'barber' || role === 'provider';
    if (aud === 'shop_owners') return role === 'shop_owner';
    return false;
}

function isRegistrationOpen(event: {
    status: string | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    start_at: string;
}): { open: boolean; reason?: string } {
    if (event.status !== 'published') return { open: false, reason: 'Registration is not open for this event.' };
    const now = Date.now();
    const opens = event.registration_opens_at
        ? new Date(event.registration_opens_at).getTime()
        : now - 1;
    const closes = event.registration_closes_at
        ? new Date(event.registration_closes_at).getTime()
        : new Date(event.start_at).getTime();
    if (now < opens) return { open: false, reason: 'Registration has not opened yet.' };
    if (now > closes) return { open: false, reason: 'Registration is closed for this event.' };
    return { open: true };
}

async function registrationCounts(eventId: string) {
    const registered = await prisma.event_registrations.count({
        where: { event_id: eventId, status: 'registered' },
    });
    const waitlist = await prisma.event_registrations.count({
        where: { event_id: eventId, status: 'waitlist' },
    });
    return { registered, waitlist };
}

function serializeEvent(
    row: {
        id: string;
        title: string;
        description: string | null;
        event_type: string | null;
        format: string | null;
        start_at: string;
        end_at: string | null;
        timezone: string | null;
        location: string | null;
        meeting_url: string | null;
        image_url: string | null;
        max_capacity: number | null;
        status: string | null;
        target_audience: string | null;
        registration_opens_at: string | null;
        registration_closes_at: string | null;
        created_by: string | null;
        created_at: string | null;
        updated_at: string | null;
    },
    extras?: {
        registered_count?: number;
        waitlist_count?: number;
        spots_left?: number | null;
        my_registration?: { status: string; id: string } | null;
        registration_open?: boolean;
        registration_reason?: string;
    }
) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        event_type: row.event_type ?? 'webinar',
        format: row.format ?? 'online',
        start_at: row.start_at,
        end_at: row.end_at,
        timezone: row.timezone ?? 'UTC',
        location: row.location,
        meeting_url: row.meeting_url,
        image_url: row.image_url,
        max_capacity: row.max_capacity,
        status: row.status ?? 'draft',
        target_audience: row.target_audience ?? 'all_providers',
        registration_opens_at: row.registration_opens_at,
        registration_closes_at: row.registration_closes_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ...extras,
    };
}

export async function listProviderEvents(userId: string, role?: string | null) {
    if (!isProviderRole(role)) throw new Error('Only barbers and shop owners can access provider events');

    const rows = await prisma.platform_events.findMany({
        where: {
            status: { in: ['published', 'completed'] },
        },
        orderBy: { start_at: 'asc' },
        take: 100,
    });

    const filtered = rows.filter((e) => roleMatchesAudience(role, e.target_audience));
    const result = [];

    for (const row of filtered) {
        const counts = await registrationCounts(row.id);
        const myReg = await prisma.event_registrations.findUnique({
            where: { event_id_user_id: { event_id: row.id, user_id: userId } },
            select: { id: true, status: true },
        });
        const regCheck = isRegistrationOpen(row);
        const spotsLeft =
            row.max_capacity != null ? Math.max(0, row.max_capacity - counts.registered) : null;

        result.push(
            serializeEvent(
                {
                    ...row,
                    meeting_url:
                        myReg && (myReg.status === 'registered' || myReg.status === 'attended')
                            ? row.meeting_url
                            : null,
                },
                {
                registered_count: counts.registered,
                waitlist_count: counts.waitlist,
                spots_left: spotsLeft,
                my_registration:
                    myReg && myReg.status !== 'cancelled'
                        ? { id: myReg.id, status: myReg.status ?? 'registered' }
                        : null,
                registration_open: regCheck.open,
                registration_reason: regCheck.reason,
            })
        );
    }

    return result;
}

export async function listMyEventRegistrations(userId: string) {
    const rows = await prisma.event_registrations.findMany({
        where: {
            user_id: userId,
            status: { in: ['registered', 'waitlist', 'attended'] },
        },
        include: { event: true },
        orderBy: { registered_at: 'desc' },
        take: 50,
    });

    return rows.map((r) => ({
        id: r.id,
        status: r.status,
        registered_at: r.registered_at,
        attended_at: r.attended_at,
        event: r.event ? serializeEvent(r.event) : null,
        meeting_url:
            r.event && (r.status === 'registered' || r.status === 'attended')
                ? r.event.meeting_url
                : null,
    }));
}

export async function getProviderEvent(eventId: string, userId: string, role?: string | null) {
    if (!isProviderRole(role)) throw new Error('Only providers can view this event');

    const row = await prisma.platform_events.findUnique({ where: { id: eventId } });
    if (!row || row.status === 'draft') throw new Error('Event not found');
    if (!roleMatchesAudience(role, row.target_audience)) throw new Error('This event is not available for your role');

    const counts = await registrationCounts(eventId);
    const myReg = await prisma.event_registrations.findUnique({
        where: { event_id_user_id: { event_id: eventId, user_id: userId } },
        select: { id: true, status: true },
    });
    const regCheck = isRegistrationOpen(row);

    return serializeEvent(row, {
        registered_count: counts.registered,
        waitlist_count: counts.waitlist,
        spots_left: row.max_capacity != null ? Math.max(0, row.max_capacity - counts.registered) : null,
        my_registration:
            myReg && myReg.status !== 'cancelled'
                ? { id: myReg.id, status: myReg.status ?? 'registered' }
                : null,
        registration_open: regCheck.open,
        registration_reason: regCheck.reason,
        meeting_url:
            myReg && (myReg.status === 'registered' || myReg.status === 'attended')
                ? row.meeting_url
                : undefined,
    });
}

export async function registerForEvent(eventId: string, userId: string, role?: string | null) {
    if (!isProviderRole(role)) throw new Error('Only barbers and shop owners can register for events');

    const event = await prisma.platform_events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');
    if (!roleMatchesAudience(role, event.target_audience)) {
        throw new Error('This event is not available for your account type');
    }

    const regCheck = isRegistrationOpen(event);
    if (!regCheck.open) throw new Error(regCheck.reason ?? 'Registration is closed');

    const existing = await prisma.event_registrations.findUnique({
        where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    if (existing && (existing.status === 'registered' || existing.status === 'waitlist')) {
        throw new Error('You are already registered for this event');
    }

    const counts = await registrationCounts(eventId);
    let status: 'registered' | 'waitlist' = 'registered';
    if (event.max_capacity != null && counts.registered >= event.max_capacity) {
        status = 'waitlist';
    }

    const ts = nowIso();
    const reg = existing
        ? await prisma.event_registrations.update({
              where: { id: existing.id },
              data: { status, registered_at: ts, cancelled_at: null },
          })
        : await prisma.event_registrations.create({
              data: {
                  id: crypto.randomUUID(),
                  event_id: eventId,
                  user_id: userId,
                  status,
                  registered_at: ts,
              },
          });

    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            title: status === 'waitlist' ? 'Added to waitlist' : 'Event registration confirmed',
            content:
                status === 'waitlist'
                    ? `You are on the waitlist for "${event.title}".`
                    : `You are registered for "${event.title}" on ${event.start_at.slice(0, 10)}.`,
            type: 'event_registration',
            is_read: false,
        },
    });

    return {
        registration: reg,
        status,
        message:
            status === 'waitlist'
                ? 'Event is full, you have been added to the waitlist.'
                : 'Registration confirmed!',
    };
}

export async function cancelEventRegistration(eventId: string, userId: string) {
    const reg = await prisma.event_registrations.findUnique({
        where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    if (!reg || reg.status === 'cancelled') throw new Error('No active registration found');

    const wasRegistered = reg.status === 'registered';
    await prisma.event_registrations.update({
        where: { id: reg.id },
        data: { status: 'cancelled', cancelled_at: nowIso() },
    });

    if (wasRegistered) {
        const nextWaitlist = await prisma.event_registrations.findFirst({
            where: { event_id: eventId, status: 'waitlist' },
            orderBy: { registered_at: 'asc' },
        });
        if (nextWaitlist) {
            await prisma.event_registrations.update({
                where: { id: nextWaitlist.id },
                data: { status: 'registered', registered_at: nowIso() },
            });
            await prisma.notifications.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: nextWaitlist.user_id,
                    title: 'Spot available!',
                    content: 'A spot opened up, you are now registered for the event.',
                    type: 'event_registration',
                    is_read: false,
                },
            });
        }
    }

    return { success: true };
}

export async function listAdminEvents() {
    const rows = await prisma.platform_events.findMany({
        orderBy: { start_at: 'desc' },
        take: 100,
    });
    const result = [];
    for (const row of rows) {
        const counts = await registrationCounts(row.id);
        result.push(serializeEvent(row, { registered_count: counts.registered, waitlist_count: counts.waitlist }));
    }
    return result;
}

export async function createAdminEvent(
    adminId: string,
    input: {
        title: string;
        description?: string;
        event_type?: string;
        format?: string;
        start_at: string;
        end_at?: string;
        timezone?: string;
        location?: string;
        meeting_url?: string;
        image_url?: string;
        max_capacity?: number;
        target_audience?: string;
        registration_opens_at?: string;
        registration_closes_at?: string;
        status?: string;
    }
) {
    if (!input.title?.trim()) throw new Error('Title is required');
    if (!input.start_at) throw new Error('start_at is required');

    const ts = nowIso();
    return prisma.platform_events.create({
        data: {
            id: crypto.randomUUID(),
            title: input.title.trim(),
            description: input.description?.trim() || null,
            event_type: input.event_type ?? 'webinar',
            format: input.format ?? 'online',
            start_at: input.start_at,
            end_at: input.end_at ?? null,
            timezone: input.timezone ?? 'UTC',
            location: input.location ?? null,
            meeting_url: input.meeting_url ?? null,
            image_url: input.image_url ?? null,
            max_capacity: input.max_capacity ?? null,
            target_audience: input.target_audience ?? 'all_providers',
            registration_opens_at: input.registration_opens_at ?? ts,
            registration_closes_at: input.registration_closes_at ?? input.start_at,
            status: input.status ?? 'draft',
            created_by: adminId,
            created_at: ts,
            updated_at: ts,
        },
    });
}

export async function updateAdminEvent(
    eventId: string,
    input: Partial<{
        title: string;
        description: string;
        event_type: string;
        format: string;
        start_at: string;
        end_at: string;
        timezone: string;
        location: string;
        meeting_url: string;
        image_url: string;
        max_capacity: number;
        target_audience: string;
        registration_opens_at: string;
        registration_closes_at: string;
        status: EventStatus;
    }>
) {
    const event = await prisma.platform_events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    if (input.status && !EVENT_STATUSES.includes(input.status)) throw new Error('Invalid status');

    return prisma.platform_events.update({
        where: { id: eventId },
        data: {
            ...(input.title !== undefined ? { title: input.title.trim() } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.event_type !== undefined ? { event_type: input.event_type } : {}),
            ...(input.format !== undefined ? { format: input.format } : {}),
            ...(input.start_at !== undefined ? { start_at: input.start_at } : {}),
            ...(input.end_at !== undefined ? { end_at: input.end_at } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
            ...(input.location !== undefined ? { location: input.location } : {}),
            ...(input.meeting_url !== undefined ? { meeting_url: input.meeting_url } : {}),
            ...(input.image_url !== undefined ? { image_url: input.image_url } : {}),
            ...(input.max_capacity !== undefined ? { max_capacity: input.max_capacity } : {}),
            ...(input.target_audience !== undefined ? { target_audience: input.target_audience } : {}),
            ...(input.registration_opens_at !== undefined
                ? { registration_opens_at: input.registration_opens_at }
                : {}),
            ...(input.registration_closes_at !== undefined
                ? { registration_closes_at: input.registration_closes_at }
                : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            updated_at: nowIso(),
        },
    });
}

export async function listEventRegistrationsAdmin(eventId: string) {
    const rows = await prisma.event_registrations.findMany({
        where: { event_id: eventId, status: { not: 'cancelled' } },
        include: {
            user: { select: { id: true, full_name: true, email: true, role: true } },
        },
        orderBy: { registered_at: 'asc' },
    });
    return rows.map((r) => ({
        id: r.id,
        status: r.status,
        registered_at: r.registered_at,
        attended_at: r.attended_at,
        user: r.user,
    }));
}

export async function markRegistrationAttended(registrationId: string) {
    const reg = await prisma.event_registrations.findUnique({ where: { id: registrationId } });
    if (!reg) throw new Error('Registration not found');
    return prisma.event_registrations.update({
        where: { id: registrationId },
        data: { status: 'attended', attended_at: nowIso() },
    });
}

export function getEventsConfig() {
    return {
        event_types: EVENT_TYPES,
        formats: EVENT_FORMATS,
        statuses: EVENT_STATUSES,
        audiences: EVENT_AUDIENCES,
    };
}
