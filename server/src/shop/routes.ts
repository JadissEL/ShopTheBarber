import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    assertShopManager,
    addShopTeamMember,
    getShopScheduleOverview,
    listShopClients,
    listShopTeam,
    listShopTeamMember,
    removeShopTeamMember,
    updateShopTeamMember,
    upsertStaffServiceConfigs,
} from './logic';

type AuthUser = { id: string; role?: string };

async function requireManager(
    request: { user?: AuthUser; entityScopeCache?: unknown },
    reply: { status: (n: number) => { send: (b: unknown) => void } },
    shopId: string
): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0], reply as Parameters<typeof authenticateRequest>[1]);
    if (!ok) return null;
    const user = (request as { user: AuthUser }).user;
    if (!['barber', 'shop_owner', 'admin'].includes(user.role ?? '')) {
        reply.status(403).send({ error: 'Provider access required' });
        return null;
    }
    try {
        await assertShopManager(user, shopId, request.entityScopeCache as Parameters<typeof assertShopManager>[2]);
    } catch {
        reply.status(403).send({ error: 'Forbidden: shop owner or manager access required' });
        return null;
    }
    return user;
}

export async function shopRoutes(fastify: FastifyInstance) {
    fastify.get<{ Params: { shopId: string } }>('/api/shop/:shopId/team', async (request, reply) => {
        const { shopId } = request.params;
        const user = await requireManager(request, reply, shopId);
        if (!user) return;
        try {
            return await listShopTeam(shopId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load team';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post<{ Params: { shopId: string }; Body: Record<string, unknown> }>(
        '/api/shop/:shopId/team',
        async (request, reply) => {
            const { shopId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            const body = request.body ?? {};
            try {
                const member = await addShopTeamMember(shopId, {
                    name: String(body.name ?? ''),
                    role: typeof body.role === 'string' ? body.role : undefined,
                    title: typeof body.title === 'string' ? body.title : undefined,
                    skills: Array.isArray(body.skills) ? body.skills.map(String) : undefined,
                    booking_enabled: body.booking_enabled !== false,
                });
                return reply.status(201).send(member);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to add team member';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { shopId: string; memberId: string } }>(
        '/api/shop/:shopId/team/:memberId',
        async (request, reply) => {
            const { shopId, memberId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            try {
                return await listShopTeamMember(shopId, memberId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Team member not found';
                return reply.status(404).send({ error: msg });
            }
        }
    );

    fastify.patch<{ Params: { shopId: string; memberId: string }; Body: Record<string, unknown> }>(
        '/api/shop/:shopId/team/:memberId',
        async (request, reply) => {
            const { shopId, memberId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            const body = request.body ?? {};
            try {
                return await updateShopTeamMember(shopId, memberId, {
                    role: typeof body.role === 'string' ? body.role : undefined,
                    status: typeof body.status === 'string' ? body.status : undefined,
                    booking_enabled:
                        body.booking_enabled !== undefined ? Boolean(body.booking_enabled) : undefined,
                    name: typeof body.name === 'string' ? body.name : undefined,
                    title: typeof body.title === 'string' ? body.title : undefined,
                    bio: typeof body.bio === 'string' ? body.bio : undefined,
                    skills: Array.isArray(body.skills) ? body.skills.map(String) : undefined,
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update team member';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.delete<{ Params: { shopId: string; memberId: string } }>(
        '/api/shop/:shopId/team/:memberId',
        async (request, reply) => {
            const { shopId, memberId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            try {
                return await removeShopTeamMember(shopId, memberId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to remove team member';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.put<{ Params: { shopId: string; memberId: string }; Body: { configs?: unknown[] } }>(
        '/api/shop/:shopId/team/:memberId/services',
        async (request, reply) => {
            const { shopId, memberId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            const configs = Array.isArray(request.body?.configs) ? request.body.configs : [];
            try {
                const parsed = configs.map((c: Record<string, unknown>) => ({
                    service_id: String(c.service_id),
                    custom_price: c.custom_price != null ? Number(c.custom_price) : null,
                    custom_duration: c.custom_duration != null ? Number(c.custom_duration) : null,
                    is_enabled: c.is_enabled !== false,
                }));
                return await upsertStaffServiceConfigs(shopId, memberId, parsed);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to save service settings';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { shopId: string }; Querystring: { limit?: string } }>(
        '/api/shop/:shopId/clients',
        async (request, reply) => {
            const { shopId } = request.params;
            const user = await requireManager(request, reply, shopId);
            if (!user) return;
            const limit = Math.min(200, Math.max(1, parseInt(request.query.limit ?? '100', 10) || 100));
            try {
                return await listShopClients(shopId, limit);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load clients';
                return reply.status(500).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { shopId: string } }>('/api/shop/:shopId/schedule', async (request, reply) => {
        const { shopId } = request.params;
        const user = await requireManager(request, reply, shopId);
        if (!user) return;
        try {
            return await getShopScheduleOverview(shopId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load schedule';
            return reply.status(500).send({ error: msg });
        }
    });
}
