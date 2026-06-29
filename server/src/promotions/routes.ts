import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    createAdminPromotion,
    deactivateAdminPromotion,
    getAdminPromotion,
    getPromoAdminConfig,
    listAdminPromotions,
    updateAdminPromotion,
    type AdminPromoInput,
} from './logic';

async function requireAdmin(
    request: Parameters<typeof authenticateRequest>[0],
    reply: Parameters<typeof authenticateRequest>[1]
) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    if (request.user?.role !== 'admin') {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return request.user;
}

export async function promotionsRoutes(fastify: FastifyInstance) {
    fastify.get('/api/promotions/admin/config', async () => getPromoAdminConfig());

    fastify.get('/api/promotions/admin/list', async (request, reply) => {
        if (!(await requireAdmin(request, reply))) return;
        return listAdminPromotions();
    });

    fastify.get<{ Params: { id: string } }>('/api/promotions/admin/:id', async (request, reply) => {
        if (!(await requireAdmin(request, reply))) return;
        const row = await getAdminPromotion(request.params.id);
        if (!row) return reply.status(404).send({ error: 'Promo not found' });
        return row;
    });

    fastify.post<{ Body: AdminPromoInput }>('/api/promotions/admin', async (request, reply) => {
        if (!(await requireAdmin(request, reply))) return;
        try {
            return await createAdminPromotion(request.body ?? ({} as AdminPromoInput));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create promo';
            if (msg.includes('Unique constraint')) {
                return reply.status(409).send({ error: 'Promo code already exists' });
            }
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { id: string }; Body: Partial<AdminPromoInput> }>(
        '/api/promotions/admin/:id',
        async (request, reply) => {
            if (!(await requireAdmin(request, reply))) return;
            try {
                return await updateAdminPromotion(request.params.id, request.body ?? {});
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update promo';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { id: string } }>(
        '/api/promotions/admin/:id/deactivate',
        async (request, reply) => {
            if (!(await requireAdmin(request, reply))) return;
            try {
                return await deactivateAdminPromotion(request.params.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to deactivate promo';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
