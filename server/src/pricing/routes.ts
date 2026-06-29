import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest, resolveOptionalUserId } from '../auth/requestUser';
import { getManagedShopIdsForUser } from '../entityScope';
import {
    calculateBookingQuote,
    getActivePricingPolicy,
    getBookingOffers,
    validateBundleAgainstServices,
    validateBundleWriteInput,
} from './logic';

type AuthUser = { id: string; role?: string };

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireProvider(request: any, reply: any): Promise<AuthUser | null> {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!['barber', 'shop_owner', 'admin'].includes(user.role ?? '')) {
        reply.status(403).send({ error: 'Only providers can manage pricing bundles' });
        return null;
    }
    return user;
}

export async function pricingRoutes(fastify: FastifyInstance) {
    fastify.get('/api/pricing/policy', async (_request, reply) => {
        try {
            const policy = await getActivePricingPolicy();
            return {
                ...policy,
                description:
                    'Autonomous pricing within these bounds keeps the marketplace fair for clients and competitors.',
            };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load pricing policy';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get<{
        Querystring: {
            shop_id?: string;
            barber_id?: string;
            shop_member_id?: string;
            service_ids?: string;
        };
    }>('/api/pricing/offers', async (request, reply) => {
        const { shop_id, barber_id, shop_member_id, service_ids } = request.query || {};
        if (!shop_id && !barber_id) {
            return reply.status(400).send({ error: 'shop_id or barber_id is required' });
        }
        const ids = service_ids
            ? service_ids.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
        try {
            return await getBookingOffers({
                service_ids: ids,
                shop_id: shop_id ?? null,
                barber_id: barber_id ?? null,
                shop_member_id: shop_member_id ?? null,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load booking offers';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{
        Body: {
            service_ids: string[];
            barber_id: string;
            shop_id?: string | null;
            shop_member_id?: string | null;
            promo_code?: string | null;
            context_type?: 'shop' | 'independent';
        };
    }>('/api/pricing/quote', async (request, reply) => {
        const userId = await resolveOptionalUserId(request);
        const body = request.body;
        if (!body?.service_ids?.length || !body.barber_id) {
            return reply.status(400).send({ error: 'service_ids and barber_id are required' });
        }
        try {
            return await calculateBookingQuote({
                service_ids: body.service_ids,
                barber_id: body.barber_id,
                shop_id: body.shop_id ?? null,
                shop_member_id: body.shop_member_id ?? null,
                user_id: userId ?? undefined,
                promo_code: userId ? (body.promo_code ?? null) : null,
                context_type: body.context_type,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to calculate quote';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get<{ Querystring: { shop_id?: string; barber_id?: string } }>(
        '/api/pricing/bundles',
        async (request, reply) => {
            const { shop_id, barber_id } = request.query || {};
            if (!shop_id && !barber_id) {
                return reply.status(400).send({ error: 'shop_id or barber_id is required' });
            }
            try {
                const rows = await prisma.service_bundles.findMany({
                    where: {
                        is_active: true,
                        ...(shop_id ? { shop_id } : {}),
                        ...(barber_id ? { barber_id } : {}),
                    },
                    include: { items: { include: { service: { select: { id: true, name: true, price: true } } } } },
                    orderBy: { name: 'asc' },
                });
                return rows.map((b) => ({
                    ...b,
                    service_ids: b.items.map((i) => i.service_id),
                    services: b.items.map((i) => i.service),
                }));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to list bundles';
                return reply.status(500).send({ error: msg });
            }
        }
    );

    fastify.get('/api/pricing/bundles/mine', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        try {
            const shopIds = await getManagedShopIdsForUser(user.id, request.entityScopeCache);
            const where =
                user.role === 'admin'
                    ? {}
                    : shopIds.length > 0
                      ? { shop_id: { in: shopIds } }
                      : { shop_id: '__none__' };
            const rows = await prisma.service_bundles.findMany({
                where,
                include: { items: { include: { service: { select: { id: true, name: true, price: true } } } } },
                orderBy: { updated_at: 'desc' },
            });
            return rows.map((b) => ({
                ...b,
                service_ids: b.items.map((i) => i.service_id),
                services: b.items.map((i) => i.service),
            }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list your bundles';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/pricing/bundles', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        const body = request.body as Record<string, unknown>;
        try {
            const policy = await getActivePricingPolicy();
            const parsed = validateBundleWriteInput({
                name: body.name as string,
                service_ids: body.service_ids as string[],
                bundle_price: body.bundle_price as number | null,
                discount_type: body.discount_type as string | null,
                discount_value: body.discount_value as number | null,
                policy,
            });

            const shopId = body.shop_id as string | undefined;
            if (!shopId) return reply.status(400).send({ error: 'shop_id is required' });
            if (user.role !== 'admin') {
                const ids = await getManagedShopIdsForUser(user.id, request.entityScopeCache);
                if (!ids.includes(shopId)) return reply.status(403).send({ error: 'Forbidden' });
            }

            const services = await prisma.services.findMany({
                where: { id: { in: parsed.service_ids }, shop_id: shopId },
            });
            if (services.length !== parsed.service_ids.length) {
                return reply.status(400).send({ error: 'All combo services must belong to your shop' });
            }

            await validateBundleAgainstServices(
                parsed.service_ids,
                parsed.bundle_price,
                parsed.discount_type,
                parsed.discount_value,
                policy
            );

            const now = new Date().toISOString();
            const bundle = await prisma.service_bundles.create({
                data: {
                    name: parsed.name,
                    description: typeof body.description === 'string' ? body.description.trim() || null : null,
                    shop_id: shopId,
                    barber_id: typeof body.barber_id === 'string' ? body.barber_id : null,
                    bundle_price: parsed.bundle_price,
                    discount_type: parsed.discount_type,
                    discount_value: parsed.discount_value,
                    is_active: body.is_active !== false,
                    created_by: user.id,
                    updated_at: now,
                    items: {
                        create: parsed.service_ids.map((service_id) => ({ id: crypto.randomUUID(), service_id })),
                    },
                },
                include: { items: true },
            });
            return reply.status(201).send({
                ...bundle,
                service_ids: bundle.items.map((i) => i.service_id),
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create bundle';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { id: string } }>('/api/pricing/bundles/:id', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        const { id } = request.params;
        const body = request.body as Record<string, unknown>;
        try {
            const existing = await prisma.service_bundles.findUnique({ where: { id }, include: { items: true } });
            if (!existing) return reply.status(404).send({ error: 'Bundle not found' });
            if (user.role !== 'admin' && existing.shop_id) {
                const ids = await getManagedShopIdsForUser(user.id, request.entityScopeCache);
                if (!ids.includes(existing.shop_id)) return reply.status(404).send({ error: 'Bundle not found' });
            }

            const policy = await getActivePricingPolicy();
            const serviceIds = (body.service_ids as string[] | undefined) ?? existing.items.map((i) => i.service_id);
            const parsed = validateBundleWriteInput({
                name: (body.name as string) ?? existing.name,
                service_ids: serviceIds,
                bundle_price:
                    body.bundle_price !== undefined ? (body.bundle_price as number | null) : existing.bundle_price,
                discount_type:
                    body.discount_type !== undefined
                        ? (body.discount_type as string | null)
                        : existing.discount_type,
                discount_value:
                    body.discount_value !== undefined
                        ? (body.discount_value as number | null)
                        : existing.discount_value,
                policy,
            });

            if (existing.shop_id) {
                const services = await prisma.services.findMany({
                    where: { id: { in: parsed.service_ids }, shop_id: existing.shop_id },
                });
                if (services.length !== parsed.service_ids.length) {
                    return reply.status(400).send({ error: 'All combo services must belong to the shop' });
                }
            }

            await validateBundleAgainstServices(
                parsed.service_ids,
                parsed.bundle_price,
                parsed.discount_type,
                parsed.discount_value,
                policy
            );

            const now = new Date().toISOString();
            await prisma.service_bundle_items.deleteMany({ where: { bundle_id: id } });
            const updated = await prisma.service_bundles.update({
                where: { id },
                data: {
                    name: parsed.name,
                    description:
                        typeof body.description === 'string' ? body.description.trim() || null : existing.description,
                    bundle_price: parsed.bundle_price,
                    discount_type: parsed.discount_type,
                    discount_value: parsed.discount_value,
                    is_active: body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active,
                    updated_at: now,
                    items: {
                        create: parsed.service_ids.map((service_id) => ({ id: crypto.randomUUID(), service_id })),
                    },
                },
                include: { items: true },
            });
            return { ...updated, service_ids: updated.items.map((i) => i.service_id) };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update bundle';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/api/pricing/bundles/:id', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.service_bundles.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Bundle not found' });
            if (user.role !== 'admin' && existing.shop_id) {
                const ids = await getManagedShopIdsForUser(user.id, request.entityScopeCache);
                if (!ids.includes(existing.shop_id)) return reply.status(404).send({ error: 'Bundle not found' });
            }
            await prisma.service_bundles.delete({ where: { id } });
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete bundle';
            return reply.status(500).send({ error: msg });
        }
    });
}
