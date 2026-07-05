import type { FastifyInstance } from 'fastify';
import { parseExploreSearchQuery, parseExploreShopQuery, searchExploreBarbers, searchExploreShops } from './logic';

export async function exploreRoutes(fastify: FastifyInstance) {
    fastify.get<{
        Querystring: {
            q?: string;
            city?: string;
            service?: string;
            language?: string;
            kids?: string;
            mobile?: string;
            shop?: string;
            group?: string;
            highlight?: string;
            limit?: string;
            offset?: string;
        };
    }>('/api/explore/barbers', async (request, reply) => {
        try {
            const params = parseExploreSearchQuery(request.query || {});
            return await searchExploreBarbers(params);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Explore search failed';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get<{
        Querystring: {
            q?: string;
            city?: string;
            language?: string;
            kids?: string;
            limit?: string;
            offset?: string;
        };
    }>('/api/explore/shops', async (request, reply) => {
        try {
            const params = parseExploreShopQuery(request.query || {});
            return await searchExploreShops(params);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Explore shop search failed';
            return reply.status(500).send({ error: msg });
        }
    });
}
