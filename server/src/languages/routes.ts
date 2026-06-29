import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { assertShopManager } from '../shop/logic';
import {
    enrichWithParsedLanguages,
    normalizeLanguageInput,
    parseSpokenLanguages,
    serializeLanguageOptions,
    stringifySpokenLanguages,
} from './logic';

export async function languagesRoutes(fastify: FastifyInstance) {
    /** GET /api/languages/options, public list of supported languages */
    fastify.get('/api/languages/options', async (_request, reply) => {
        return reply.send(serializeLanguageOptions());
    });

    /** GET /api/provider/languages, barber + managed shop languages for current provider */
    fastify.get('/api/provider/languages', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!['barber', 'shop_owner', 'admin'].includes(user.role ?? '')) {
            return reply.status(403).send({ error: 'Provider access required' });
        }
        try {
            const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            let shop: { id: string; name: string; spoken_languages: string | null } | null = null;

            if (barber?.shop_id) {
                shop = await prisma.shops.findUnique({
                    where: { id: barber.shop_id },
                    select: { id: true, name: true, spoken_languages: true },
                });
            }
            if (!shop) {
                shop = await prisma.shops.findFirst({
                    where: { owner_id: user.id },
                    select: { id: true, name: true, spoken_languages: true },
                });
            }

            return {
                barber: barber
                    ? enrichWithParsedLanguages({
                          id: barber.id,
                          name: barber.name,
                          spoken_languages: barber.spoken_languages,
                      })
                    : null,
                shop: shop ? enrichWithParsedLanguages(shop) : null,
            };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** PUT /api/provider/barber/languages */
    fastify.put<{ Body: { languages?: string[] } }>('/api/provider/barber/languages', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        const body = request.body;
        try {
            const codes = normalizeLanguageInput(body.languages ?? []);
            let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            if (!barber && ['barber', 'shop_owner'].includes(user.role ?? '')) {
                barber = await prisma.barbers.create({
                    data: {
                        user_id: user.id,
                        name: user.full_name || user.email || 'Barber',
                        spoken_languages: stringifySpokenLanguages(codes),
                    },
                });
            }
            if (!barber) {
                return reply.status(404).send({ error: 'Barber profile not found' });
            }
            if (barber.user_id !== user.id && user.role !== 'admin') {
                return reply.status(403).send({ error: 'Not allowed' });
            }
            const updated = await prisma.barbers.update({
                where: { id: barber.id },
                data: {
                    spoken_languages: stringifySpokenLanguages(codes),
                    updated_at: new Date().toISOString(),
                },
            });
            return enrichWithParsedLanguages(updated);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update languages';
            return reply.status(400).send({ error: msg });
        }
    });

    /** PUT /api/provider/shop/:shopId/languages */
    fastify.put<{ Params: { shopId: string }; Body: { languages?: string[] } }>(
        '/api/provider/shop/:shopId/languages',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;
            const { shopId } = request.params;
            const body = request.body;
            try {
                const shop = await prisma.shops.findUnique({ where: { id: shopId } });
                if (!shop) return reply.status(404).send({ error: 'Shop not found' });

                const isOwner = shop.owner_id === user.id;
                if (!isOwner && user.role !== 'admin') {
                    await assertShopManager(user, shopId, request.entityScopeCache);
                }

                const codes = normalizeLanguageInput(body.languages ?? []);
                const updated = await prisma.shops.update({
                    where: { id: shopId },
                    data: {
                        spoken_languages: stringifySpokenLanguages(codes),
                        updated_at: new Date().toISOString(),
                    },
                });
                return enrichWithParsedLanguages(updated);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update shop languages';
                const status = msg.includes('Forbidden') || msg.includes('access') ? 403 : 400;
                return reply.status(status).send({ error: msg });
            }
        }
    );

    /** GET /api/barbers/:id/languages, public effective languages (barber + shop) */
    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/languages', async (request, reply) => {
        const { id } = request.params;
        try {
            const barber = await prisma.barbers.findUnique({ where: { id } });
            if (!barber) return reply.status(404).send({ error: 'Barber not found' });
            const barberLangs = parseSpokenLanguages(barber.spoken_languages);
            let shopLangs: string[] = [];
            let shopName: string | null = null;
            if (barber.shop_id) {
                const shop = await prisma.shops.findUnique({
                    where: { id: barber.shop_id },
                    select: { spoken_languages: true, name: true },
                });
                if (shop) {
                    shopLangs = parseSpokenLanguages(shop.spoken_languages);
                    shopName = shop.name;
                }
            }
            const effective = [...new Set([...barberLangs, ...shopLangs])];
            return {
                barber_languages: barberLangs,
                shop_languages: shopLangs,
                effective_languages: effective,
                shop_name: shopName,
            };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** GET /api/shops/:id/languages, public shop languages */
    fastify.get<{ Params: { id: string } }>('/api/shops/:id/languages', async (request, reply) => {
        const { id } = request.params;
        try {
            const shop = await prisma.shops.findUnique({ where: { id } });
            if (!shop) return reply.status(404).send({ error: 'Shop not found' });
            return enrichWithParsedLanguages({
                id: shop.id,
                name: shop.name,
                spoken_languages: shop.spoken_languages,
            });
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });
}
