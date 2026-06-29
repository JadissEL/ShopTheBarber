import type { FastifyInstance } from 'fastify';
import { getHomepageContent } from './logic';

export async function homeRoutes(fastify: FastifyInstance) {
    fastify.get('/api/public/home', async (_request, reply) => {
        try {
            return await getHomepageContent();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load homepage';
            return reply.status(500).send({ error: msg });
        }
    });
}
