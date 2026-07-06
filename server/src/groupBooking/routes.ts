import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest, resolveOptionalUserId } from '../auth/requestUser';
import { canAccessBookingProviderTools } from '../auth/platformRbac';
import {
    ABSOLUTE_MAX_PARTY,
    ABSOLUTE_MIN_PARTY,
    DEFAULT_MAX_PARTY,
    GROUP_BOOKING_LABEL,
    MAX_GROUP_DISCOUNT_PERCENT,
    type GroupGuestInput,
} from './config';
import {
    calculateGroupBookingQuote,
    clampGroupDiscount,
    clampPartyBounds,
    getGroupBookingCapabilities,
    listGroupBookingBarbers,
    loadBarberForGroupBooking,
} from './logic';

async function requireAdmin(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    const user = request.user!;
    if (user.role !== 'admin') {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return user;
}

export async function groupBookingRoutes(fastify: FastifyInstance) {
    fastify.get('/api/group-booking/config', async () => ({
        label: GROUP_BOOKING_LABEL,
        description:
            'Book weddings, groomsmen, and group grooming for friends and family, at the shop or at the client\'s location. One account books for the whole party; guests only need names.',
        min_party: ABSOLUTE_MIN_PARTY,
        max_party: ABSOLUTE_MAX_PARTY,
        max_group_discount_percent: MAX_GROUP_DISCOUNT_PERCENT,
    }));

    fastify.get('/api/public/vip-group-barbers', async () => ({
        barbers: await listGroupBookingBarbers(6),
    }));

    fastify.get('/api/public/group-booking-barbers', async () => ({
        barbers: await listGroupBookingBarbers(6),
    }));

    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/group-booking', async (request, reply) => {
        const barber = await loadBarberForGroupBooking(request.params.id);
        if (!barber) return reply.status(404).send({ error: 'Barber not found' });
        return getGroupBookingCapabilities(barber);
    });

    fastify.get('/api/provider/group-booking', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!canAccessBookingProviderTools(user.role, user.account_type)) {
            return reply.status(403).send({ error: 'Booking provider access required' });
        }

        const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        if (!barber) {
            return {
                barber_id: null,
                is_vip: false,
                vip_source: null,
                offers_group_booking: false,
                min_party: ABSOLUTE_MIN_PARTY,
                max_party: DEFAULT_MAX_PARTY,
                group_discount_percent: 0,
            };
        }
        return getGroupBookingCapabilities(barber);
    });

    fastify.put<{
        Body: {
            offers_group_booking?: boolean;
            group_booking_min_party?: number;
            group_booking_max_party?: number;
            group_booking_discount_percent?: number;
        };
    }>('/api/provider/barber/group-booking', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!canAccessBookingProviderTools(user.role, user.account_type)) {
            return reply.status(403).send({ error: 'Booking provider access required' });
        }

        let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        if (!barber && ['barber', 'shop_owner', 'provider'].includes(user.role ?? '')) {
            barber = await prisma.barbers.create({
                data: {
                    user_id: user.id,
                    name: user.full_name || user.email || 'Barber',
                },
            });
        }
        if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
        if (barber.user_id !== user.id && user.role !== 'admin') {
            return reply.status(403).send({ error: 'Not allowed' });
        }

        const wantsGroup = request.body?.offers_group_booking === true;

        const minParty =
            typeof request.body?.group_booking_min_party === 'number'
                ? Math.max(ABSOLUTE_MIN_PARTY, Math.min(ABSOLUTE_MAX_PARTY, request.body.group_booking_min_party))
                : undefined;
        const maxParty =
            typeof request.body?.group_booking_max_party === 'number'
                ? Math.max(ABSOLUTE_MIN_PARTY, Math.min(ABSOLUTE_MAX_PARTY, request.body.group_booking_max_party))
                : undefined;

        if (minParty != null && maxParty != null && minParty > maxParty) {
            return reply.status(400).send({ error: 'Minimum party size cannot exceed maximum' });
        }

        const updated = await prisma.barbers.update({
            where: { id: barber.id },
            data: {
                ...(request.body?.offers_group_booking !== undefined
                    ? { offers_group_booking: wantsGroup }
                    : {}),
                ...(minParty != null ? { group_booking_min_party: minParty } : {}),
                ...(maxParty != null ? { group_booking_max_party: maxParty } : {}),
                ...(request.body?.group_booking_discount_percent !== undefined
                    ? {
                          group_booking_discount_percent: clampGroupDiscount(
                              request.body.group_booking_discount_percent
                          ),
                      }
                    : {}),
                updated_at: new Date().toISOString(),
            },
        });

        return getGroupBookingCapabilities(updated);
    });

    fastify.post<{
        Body: {
            barber_id: string;
            shop_id?: string | null;
            shop_member_id?: string | null;
            service_ids: string[];
            guests: GroupGuestInput[];
            promo_code?: string | null;
            context_type?: 'shop' | 'independent';
        };
    }>('/api/group-booking/quote', async (request, reply) => {
        const userId = await resolveOptionalUserId(request);
        const body = request.body;
        if (!body?.barber_id || !body.service_ids?.length || !body.guests?.length) {
            return reply.status(400).send({ error: 'barber_id, service_ids, and guests are required' });
        }
        try {
            return await calculateGroupBookingQuote({
                barber_id: body.barber_id,
                shop_id: body.shop_id ?? null,
                shop_member_id: body.shop_member_id ?? null,
                user_id: userId ?? undefined,
                promo_code: userId ? (body.promo_code ?? null) : null,
                context_type: body.context_type,
                service_ids: body.service_ids,
                guests: body.guests,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to calculate group quote';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { id: string }; Body: { is_vip?: boolean } }>(
        '/api/admin/barbers/:id/vip',
        async (request, reply) => {
            const admin = await requireAdmin(request, reply);
            if (!admin) return;

            const barber = await prisma.barbers.findUnique({ where: { id: request.params.id } });
            if (!barber) return reply.status(404).send({ error: 'Barber not found' });

            const isVip = request.body?.is_vip === true;
            const updated = await prisma.barbers.update({
                where: { id: barber.id },
                data: {
                    is_vip: isVip,
                    updated_at: new Date().toISOString(),
                },
            });

            return {
                barber_id: updated.id,
                name: updated.name,
                ...getGroupBookingCapabilities(updated),
            };
        }
    );

    fastify.get('/api/admin/vip-barbers', async (request, reply) => {
        const admin = await requireAdmin(request, reply);
        if (!admin) return;

        const barbers = await prisma.barbers.findMany({
            where: { OR: [{ status: 'active' }, { status: null }] },
            orderBy: [{ rating: 'desc' }, { name: 'asc' }],
            take: 200,
            select: {
                id: true,
                name: true,
                rating: true,
                review_count: true,
                is_vip: true,
                offers_mobile_service: true,
                offers_shop_service: true,
                offers_group_booking: true,
                group_booking_min_party: true,
                group_booking_max_party: true,
                group_booking_discount_percent: true,
            },
        });

        return barbers.map((b) => ({
            id: b.id,
            name: b.name,
            rating: b.rating ?? 0,
            review_count: b.review_count ?? 0,
            offers_mobile_service: b.offers_mobile_service === true,
            offers_shop_service: b.offers_shop_service !== false,
            mobile_only: b.offers_shop_service === false && b.offers_mobile_service === true,
            ...getGroupBookingCapabilities(b),
            party_bounds: clampPartyBounds(b),
        }));
    });
}
