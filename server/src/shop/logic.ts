import { prisma } from '../db/prisma';
import { getManagedShopIdsForUser } from '../entityScope';
import { getActivePricingPolicy } from '../pricing/logic';
import { enforceServicePriceOnWrite } from '../pricing/enforce';

export type JwtUser = { id: string; role?: string };

export function parseSkills(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
        /* comma-separated fallback */
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function serializeSkills(skills: string[] | undefined): string | null {
    if (!skills?.length) return null;
    return JSON.stringify([...new Set(skills.map((s) => s.trim()).filter(Boolean))]);
}

export async function assertShopManager(
    user: JwtUser,
    shopId: string,
    cache?: { getBarberShopIdsForUser(userId: string): Promise<{ barberIds: string[]; shopIds: string[] }> }
): Promise<void> {
    if (user.role === 'admin') return;
    const managed = await getManagedShopIdsForUser(user.id, cache);
    if (!managed.includes(shopId)) {
        throw new Error('Forbidden: shop manager access required');
    }
}

export async function listShopTeam(shopId: string) {
    const members = await prisma.shop_members.findMany({
        where: { shop_id: shopId },
        include: {
            barber: true,
            staff_configs: { include: { service: { select: { id: true, name: true, price: true, duration_minutes: true } } } },
        },
        orderBy: { joined_date: 'asc' },
    });
    return members.map((m) => ({
        ...m,
        skills: parseSkills(m.barber?.skills ?? null),
    }));
}

export async function addShopTeamMember(
    shopId: string,
    input: { name: string; role?: string; title?: string; skills?: string[]; booking_enabled?: boolean }
) {
    const name = input.name?.trim();
    if (!name || name.length < 2) throw new Error('Barber name must be at least 2 characters');

    const role = input.role ?? 'barber';
    if (!['owner', 'manager', 'barber', 'apprentice', 'receptionist', 'assistant'].includes(role)) {
        throw new Error('Invalid role');
    }

    const barber = await prisma.barbers.create({
        data: {
            id: crypto.randomUUID(),
            name,
            title: input.title ?? (role === 'manager' ? 'Shop Manager' : 'Barber'),
            skills: serializeSkills(input.skills),
            shop_id: shopId,
            status: 'active',
        },
    });

    const member = await prisma.shop_members.create({
        data: {
            id: crypto.randomUUID(),
            shop_id: shopId,
            barber_id: barber.id,
            role,
            status: 'active',
            booking_enabled: input.booking_enabled !== false,
        },
        include: { barber: true },
    });

    return { ...member, skills: parseSkills(barber.skills) };
}

export async function updateShopTeamMember(
    shopId: string,
    memberId: string,
    input: {
        role?: string;
        status?: string;
        booking_enabled?: boolean;
        name?: string;
        title?: string;
        bio?: string;
        skills?: string[];
    }
) {
    const member = await prisma.shop_members.findFirst({
        where: { id: memberId, shop_id: shopId },
        include: { barber: true },
    });
    if (!member) throw new Error('Team member not found');

    if (input.role && !['owner', 'manager', 'barber', 'apprentice'].includes(input.role)) {
        throw new Error('Invalid role');
    }
    if (input.status && !['active', 'inactive', 'pending'].includes(input.status)) {
        throw new Error('Invalid status');
    }

    const memberUpdate: Record<string, unknown> = {};
    if (input.role !== undefined) memberUpdate.role = input.role;
    if (input.status !== undefined) memberUpdate.status = input.status;
    if (input.booking_enabled !== undefined) memberUpdate.booking_enabled = input.booking_enabled;

    const barberUpdate: Record<string, unknown> = {};
    if (input.name !== undefined) barberUpdate.name = input.name.trim();
    if (input.title !== undefined) barberUpdate.title = input.title;
    if (input.bio !== undefined) barberUpdate.bio = input.bio;
    if (input.skills !== undefined) barberUpdate.skills = serializeSkills(input.skills);

    if (member.barber_id && Object.keys(barberUpdate).length > 0) {
        await prisma.barbers.update({ where: { id: member.barber_id }, data: barberUpdate });
    }
    if (Object.keys(memberUpdate).length > 0) {
        await prisma.shop_members.update({ where: { id: memberId }, data: memberUpdate });
    }

    return listShopTeamMember(shopId, memberId);
}

export async function listShopTeamMember(shopId: string, memberId: string) {
    const member = await prisma.shop_members.findFirst({
        where: { id: memberId, shop_id: shopId },
        include: {
            barber: true,
            staff_configs: { include: { service: { select: { id: true, name: true, price: true, duration_minutes: true } } } },
        },
    });
    if (!member) throw new Error('Team member not found');
    return { ...member, skills: parseSkills(member.barber?.skills ?? null) };
}

export async function removeShopTeamMember(shopId: string, memberId: string) {
    const member = await prisma.shop_members.findFirst({ where: { id: memberId, shop_id: shopId } });
    if (!member) throw new Error('Team member not found');
    if (member.role === 'owner') throw new Error('Cannot remove shop owner from roster');

    await prisma.staff_service_configs.deleteMany({ where: { shop_member_id: memberId } });
    await prisma.shifts.deleteMany({ where: { shop_member_id: memberId } });
    await prisma.shop_members.delete({ where: { id: memberId } });
    return { success: true };
}

export type StaffServiceConfigInput = {
    service_id: string;
    custom_price?: number | null;
    custom_duration?: number | null;
    is_enabled?: boolean;
};

export async function upsertStaffServiceConfigs(
    shopId: string,
    memberId: string,
    configs: StaffServiceConfigInput[]
) {
    const member = await prisma.shop_members.findFirst({ where: { id: memberId, shop_id: shopId } });
    if (!member) throw new Error('Team member not found');

    const serviceIds = configs.map((c) => c.service_id);
    const services = await prisma.services.findMany({
        where: { id: { in: serviceIds }, shop_id: shopId },
    });
    if (services.length !== new Set(serviceIds).size) {
        throw new Error('All services must belong to this shop');
    }

    const policy = await getActivePricingPolicy();

    for (const cfg of configs) {
        const base = services.find((s) => s.id === cfg.service_id);
        if (!base) continue;

        if (cfg.custom_price != null) {
            await enforceServicePriceOnWrite({ price: cfg.custom_price });
        }

        const duration = cfg.custom_duration ?? base.duration_minutes;
        if (duration < 5 || duration > 480) throw new Error('Duration must be between 5 and 480 minutes');

        const existing = await prisma.staff_service_configs.findFirst({
            where: { shop_member_id: memberId, service_id: cfg.service_id },
        });

        const payload = {
            custom_price: cfg.custom_price ?? null,
            custom_duration: cfg.custom_duration ?? null,
            is_enabled: cfg.is_enabled !== false,
        };

        if (existing) {
            await prisma.staff_service_configs.update({ where: { id: existing.id }, data: payload });
        } else {
            await prisma.staff_service_configs.create({
                data: {
                    id: crypto.randomUUID(),
                    shop_member_id: memberId,
                    service_id: cfg.service_id,
                    ...payload,
                },
            });
        }
    }

    void policy;
    return listShopTeamMember(shopId, memberId);
}

export async function listShopClients(shopId: string, limit = 100) {
    const bookings = await prisma.bookings.findMany({
        where: { shop_id: shopId, client_id: { not: null } },
        include: { client: { select: { id: true, full_name: true, email: true, phone: true, avatar_url: true } } },
        orderBy: { start_time: 'desc' },
        take: 500,
    });

    const byClient = new Map<
        string,
        {
            client_id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            avatar_url: string | null;
            visit_count: number;
            total_spent: number;
            last_visit: string;
        }
    >();

    for (const b of bookings) {
        if (!b.client_id) continue;
        const existing = byClient.get(b.client_id);
        const spent = b.status === 'completed' ? (b.price_at_booking ?? 0) : 0;
        if (!existing) {
            byClient.set(b.client_id, {
                client_id: b.client_id,
                full_name: b.client?.full_name ?? b.client_name ?? null,
                email: b.client?.email ?? null,
                phone: b.client?.phone ?? null,
                avatar_url: b.client?.avatar_url ?? null,
                visit_count: b.status === 'completed' ? 1 : 0,
                total_spent: spent,
                last_visit: b.start_time,
            });
        } else {
            if (b.status === 'completed') {
                existing.visit_count += 1;
                existing.total_spent += spent;
            }
            if (b.start_time > existing.last_visit) existing.last_visit = b.start_time;
        }
    }

    return [...byClient.values()]
        .sort((a, b) => b.last_visit.localeCompare(a.last_visit))
        .slice(0, limit);
}

export async function getShopScheduleOverview(shopId: string) {
    const [members, shifts, timeBlocks, bookings] = await Promise.all([
        listShopTeam(shopId),
        prisma.shifts.findMany({ where: { shop_id: shopId, is_active: { not: false } } }),
        prisma.time_blocks.findMany({ where: { shop_id: shopId } }),
        prisma.bookings.findMany({
            where: {
                shop_id: shopId,
                status: { in: ['pending', 'confirmed', 'in_progress'] },
            },
            orderBy: { start_time: 'asc' },
            take: 200,
        }),
    ]);

    return { members, shifts, time_blocks: timeBlocks, upcoming_bookings: bookings };
}
