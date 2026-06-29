import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { getWalletForUser } from './logic';

export async function walletRoutes(fastify: FastifyInstance) {
    fastify.get('/api/wallet/me', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await getWalletForUser(user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load wallet';
            return reply.status(500).send({ error: msg });
        }
    });
}
