import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    getPublicBarberShowcase,
    getPublicShopShowcase,
    getMyShowcase,
    getMyShowcaseCompleteness,
    updateMyBarberShowcase,
    updateMyShopShowcase,
    createCareerEntry,
    updateCareerEntry,
    deleteCareerEntry,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
} from './logic';
import { getBatchDiscoveryPreviews } from './discoveryPreviews';

const PROVIDER_ROLES = ['barber', 'shop_owner', 'admin', 'provider'] as const;

async function requireProvider(request: unknown, reply: unknown) {
    const ok = await authenticateRequest(request as Parameters<typeof authenticateRequest>[0], reply as Parameters<typeof authenticateRequest>[1]);
    if (!ok) return null;
    const user = (request as { user?: { id: string; role?: string } }).user!;
    if (!PROVIDER_ROLES.includes((user.role ?? '') as (typeof PROVIDER_ROLES)[number])) {
        (reply as { status: (n: number) => { send: (b: unknown) => void } }).status(403).send({ error: 'Provider access required' });
        return null;
    }
    return user;
}

export async function providerShowcaseRoutes(fastify: FastifyInstance) {
    fastify.get('/api/showcase/config', async () => ({
        career_entry_types: [
            { id: 'education', label: 'Education & training', hint: 'Barber school, academy, apprenticeship' },
            { id: 'employment', label: 'Work experience', hint: 'Shops, salons, or brands you worked for' },
            { id: 'certification', label: 'License & certification', hint: 'State license, master barber cert, courses' },
            { id: 'milestone', label: 'Career milestone', hint: 'Opened shop, started mobile van, major move' },
            { id: 'award', label: 'Award & recognition', hint: 'Competitions, press, local awards' },
        ],
        suggested_highlights: [
            'Hot towel shaves',
            'Precision fades',
            'Kids welcome',
            'Mobile / at-home',
            'Walk-ins welcome',
            'Beard specialist',
            'VIP experience',
            'Group bookings',
        ],
    }));

    fastify.get<{ Params: { barberId: string } }>('/api/barbers/:barberId/showcase', async (request, reply) => {
        const showcase = await getPublicBarberShowcase(request.params.barberId);
        if (!showcase) return reply.status(404).send({ error: 'Barber not found' });
        return showcase;
    });

    fastify.get<{ Params: { shopId: string } }>('/api/shops/:shopId/showcase', async (request, reply) => {
        const showcase = await getPublicShopShowcase(request.params.shopId);
        if (!showcase) return reply.status(404).send({ error: 'Shop not found' });
        return showcase;
    });

    fastify.get('/api/provider/showcase', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        return getMyShowcase(user.id);
    });

    fastify.get('/api/provider/showcase/completeness', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        return getMyShowcaseCompleteness(user.id);
    });

    fastify.get<{ Querystring: { barber_ids?: string } }>(
        '/api/showcase/discovery-previews',
        async (request) => {
            const raw = request.query.barber_ids ?? '';
            const ids = raw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            return getBatchDiscoveryPreviews(ids);
        }
    );

    fastify.put<{ Body: Record<string, unknown> }>('/api/provider/showcase/barber', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        try {
            return await updateMyBarberShowcase(user.id, request.body);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update profile';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.put<{ Body: Record<string, unknown> }>('/api/provider/showcase/shop', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        try {
            return await updateMyShopShowcase(user.id, request.body);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update shop profile';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Body: Record<string, unknown> }>('/api/provider/career-entries', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        try {
            return await createCareerEntry(user.id, request.body as Parameters<typeof createCareerEntry>[1]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create entry';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.put<{ Params: { entryId: string }; Body: Record<string, unknown> }>(
        '/api/provider/career-entries/:entryId',
        async (request, reply) => {
            const user = await requireProvider(request, reply);
            if (!user) return;
            try {
                return await updateCareerEntry(
                    user.id,
                    request.params.entryId,
                    request.body
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update entry';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.delete<{ Params: { entryId: string } }>(
        '/api/provider/career-entries/:entryId',
        async (request, reply) => {
            const user = await requireProvider(request, reply);
            if (!user) return;
            try {
                return await deleteCareerEntry(user.id, request.params.entryId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to delete entry';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Body: Record<string, unknown> }>('/api/provider/portfolio', async (request, reply) => {
        const user = await requireProvider(request, reply);
        if (!user) return;
        try {
            return await createPortfolioItem(
                user.id,
                request.body as Parameters<typeof createPortfolioItem>[1]
            );
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to add portfolio item';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.put<{ Params: { videoId: string }; Body: Record<string, unknown> }>(
        '/api/provider/portfolio/:videoId',
        async (request, reply) => {
            const user = await requireProvider(request, reply);
            if (!user) return;
            try {
                return await updatePortfolioItem(
                    user.id,
                    request.params.videoId,
                    request.body
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update portfolio item';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.delete<{ Params: { videoId: string } }>(
        '/api/provider/portfolio/:videoId',
        async (request, reply) => {
            const user = await requireProvider(request, reply);
            if (!user) return;
            try {
                return await deletePortfolioItem(user.id, request.params.videoId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to delete portfolio item';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
