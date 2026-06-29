import type { FastifyInstance } from 'fastify';
import { buildSitemapXml, getCityLanding, listPublicCities } from './logic';

export async function seoRoutes(fastify: FastifyInstance) {
    fastify.get('/api/public/cities', async (_request, reply) => {
        try {
            return await listPublicCities();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load cities';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get<{ Params: { slug: string } }>('/api/public/cities/:slug', async (request, reply) => {
        try {
            const data = await getCityLanding(request.params.slug);
            if (!data) return reply.status(404).send({ error: 'City not found' });
            return data;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load city page';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get('/api/public/sitemap.xml', async (_request, reply) => {
        const xml = await buildSitemapXml();
        return reply.type('application/xml').send(xml);
    });
}
