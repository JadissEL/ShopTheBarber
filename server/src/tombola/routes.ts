import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { subscribeTombola } from './events';
import {
    adminForceRunDraw,
    claimFreeEntry,
    getCurrentDrawPublic,
    getMyTombolaStatus,
    listAdminDraws,
    submitSkillAnswer,
    syncAllEntries,
    syncUserEntry,
} from './logic';

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return false;
    const user = request.user as { role?: string };
    if (user?.role !== 'admin') {
        void reply.status(403).send({ error: 'Forbidden' });
        return false;
    }
    return true;
}

export async function tombolaRoutes(fastify: FastifyInstance) {
    fastify.get('/api/tombola/current', async () => {
        return getCurrentDrawPublic();
    });

    fastify.get('/api/tombola/me', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const preferRole = (request.query as { role?: string }).role as 'client' | 'barber' | undefined;
        return getMyTombolaStatus(user.id, preferRole);
    });

    fastify.post('/api/tombola/sync', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const preferRole = (request.body as { role?: string })?.role as 'client' | 'barber' | undefined;
        try {
            return await syncUserEntry(user.id, { preferRole });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to sync entry';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post('/api/tombola/free-entry', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await claimFreeEntry(user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to claim free entry';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Body: { draw_id?: string; answer?: string } }>(
        '/api/tombola/claim-prize',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            const { draw_id, answer } = request.body ?? {};
            if (!draw_id || answer === undefined) {
                return reply.status(400).send({ error: 'draw_id and answer are required' });
            }
            try {
                return await submitSkillAnswer(user.id, draw_id, String(answer));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to claim prize';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get('/api/tombola/live/stream', async (request, reply) => {
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        const heartbeat = setInterval(() => {
            reply.raw.write(': ping\n\n');
        }, 25000);

        const sendState = async () => {
            const state = await getCurrentDrawPublic();
            reply.raw.write(`data: ${JSON.stringify({ type: 'full_state', ...state })}\n\n`);
        };

        void sendState();

        const unsubscribe = subscribeTombola((event) => {
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
            if (event.type === 'state' || event.type === 'winner') {
                void sendState();
            }
        });

        const poll = setInterval(() => {
            void sendState();
        }, 5000);

        request.raw.on('close', () => {
            clearInterval(heartbeat);
            clearInterval(poll);
            unsubscribe();
        });
    });

    fastify.get('/api/tombola/admin/draws', async (request, reply) => {
        const ok = await requireAdmin(request, reply);
        if (!ok) return;
        return listAdminDraws();
    });

    fastify.post<{ Params: { drawId: string } }>(
        '/api/tombola/admin/draws/:drawId/sync',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await syncAllEntries(request.params.drawId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Sync failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { drawId: string } }>(
        '/api/tombola/admin/draws/:drawId/run',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await adminForceRunDraw(request.params.drawId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Draw failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
