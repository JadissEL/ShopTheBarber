import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { isAdminRole, isProviderRole } from '../auth/platformRbac';
import { prisma } from '../db/prisma';
import {
    getPublicBarberStats,
    getPublicShopStats,
    getAdminBarberStats,
    getAdminShopStats,
    getBatchPublicBarberStats,
    getMyProviderStats,
    listAdminProvidersOverview,
    listAdminDisputesEnriched,
    resolveDispute,
} from './logic';
import {
    getShopBenchmarkDashboard,
    getBarberBenchmarkDashboard,
} from '../provider/benchmarks';

async function requireAuth(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as { id: string; role?: string };
}

async function requireAdmin(request: any, reply: any) {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!isAdminRole(user.role)) {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return user;
}

async function requireProvider(request: any, reply: any) {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!isProviderRole(user.role)) {
        reply.status(403).send({ error: 'Provider access required' });
        return null;
    }
    return user;
}

export async function providerStatsRoutes(fastify: FastifyInstance) {
    fastify.get('/api/barbers/:barberId/stats', async (request, reply) => {
        const { barberId } = request.params as { barberId: string };
        try {
            return await getPublicBarberStats(barberId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load stats';
            return reply.status(404).send({ error: msg });
        }
    });

    fastify.get('/api/shops/:shopId/stats', async (request, reply) => {
        const { shopId } = request.params as { shopId: string };
        try {
            return await getPublicShopStats(shopId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load stats';
            return reply.status(404).send({ error: msg });
        }
    });

    fastify.post<{ Body: { barber_ids?: string[] } }>('/api/barbers/stats/batch', async (request, reply) => {
        const ids = request.body?.barber_ids ?? [];
        if (!Array.isArray(ids)) {
            return reply.status(400).send({ error: 'barber_ids must be an array' });
        }
        const stats = await getBatchPublicBarberStats(ids);
        return { stats };
    });

    fastify.get('/api/provider/my-stats', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        const stats = await getMyProviderStats(user.id);
        if (!stats) {
            return reply.status(404).send({ error: 'No provider profile linked to this account' });
        }
        return stats;
    });

    fastify.get('/api/provider/benchmarks', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        const q = request.query as { shop_id?: string; barber_id?: string };
        try {
            if (q.shop_id) {
                const shop = await prisma.shops.findUnique({
                    where: { id: q.shop_id },
                    select: { owner_id: true },
                });
                if (!shop) return reply.status(404).send({ error: 'Shop not found' });
                const isOwner = shop.owner_id === user.id;
                let isManager = false;
                if (!isOwner && !isAdminRole(user.role)) {
                    const member = await prisma.shop_members.findFirst({
                        where: { shop_id: q.shop_id, user_id: user.id },
                        select: { role: true },
                    });
                    isManager = member?.role === 'owner' || member?.role === 'manager';
                }
                if (!isOwner && !isManager) {
                    return reply.status(403).send({ error: 'Forbidden' });
                }
                return await getShopBenchmarkDashboard(q.shop_id);
            }

            const barber = q.barber_id
                ? await prisma.barbers.findUnique({
                      where: { id: q.barber_id },
                      select: { id: true, user_id: true, shop_id: true },
                  })
                : await prisma.barbers.findFirst({
                      where: { user_id: user.id },
                      select: { id: true, user_id: true, shop_id: true },
                      orderBy: { created_at: 'desc' },
                  });

            if (!barber) {
                return reply.status(404).send({ error: 'No barber profile found' });
            }
            if (barber.user_id !== user.id) {
                return reply.status(403).send({ error: 'Forbidden' });
            }
            return await getBarberBenchmarkDashboard(barber.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load benchmarks';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/admin/providers/overview', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const q = request.query as { limit?: string; offset?: string; sort?: string; type?: string };
        const sort =
            q.sort === 'completed' || q.sort === 'health' || q.sort === 'disputes' || q.sort === 'name'
                ? q.sort
                : 'name';
        const type =
            q.type === 'barber' || q.type === 'shop' || q.type === 'all' ? q.type : 'all';
        return listAdminProvidersOverview({
            limit: q.limit ? Number(q.limit) : 50,
            offset: q.offset ? Number(q.offset) : 0,
            sort,
            type,
        });
    });

    fastify.get('/api/admin/providers/barber/:barberId/stats', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { barberId } = request.params as { barberId: string };
        try {
            return await getAdminBarberStats(barberId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load provider stats';
            return reply.status(404).send({ error: msg });
        }
    });

    fastify.get('/api/admin/providers/shop/:shopId/stats', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { shopId } = request.params as { shopId: string };
        try {
            return await getAdminShopStats(shopId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load shop stats';
            return reply.status(404).send({ error: msg });
        }
    });

    fastify.get('/api/admin/disputes', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const q = request.query as { limit?: string };
        const limit = q.limit ? Number(q.limit) : 100;
        return listAdminDisputesEnriched(limit);
    });

    fastify.get('/api/admin/disputes/:disputeId', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { disputeId } = request.params as { disputeId: string };
        const rows = await listAdminDisputesEnriched(500);
        const dispute = rows.find((d) => d.id === disputeId);
        if (!dispute) return reply.status(404).send({ error: 'Dispute not found' });
        return dispute;
    });

    fastify.post<{
        Body: {
            action: 'approve_claim' | 'reject_claim' | 'request_info' | 'mark_in_review';
            resolution_notes: string;
            refund_amount?: number;
        };
    }>('/api/admin/disputes/:disputeId/resolve', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { disputeId } = request.params as { disputeId: string };
        const body = request.body ?? {};
        if (!body.resolution_notes?.trim()) {
            return reply.status(400).send({ error: 'Resolution notes are required' });
        }
        try {
            return await resolveDispute({
                disputeId,
                adminUserId: user.id,
                action: body.action,
                resolutionNotes: body.resolution_notes.trim(),
                refundAmount: body.refund_amount,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to resolve dispute';
            return reply.status(400).send({ error: msg });
        }
    });
}
