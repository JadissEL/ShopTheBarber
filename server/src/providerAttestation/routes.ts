import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { canAccessBookingProviderTools } from '../auth/platformRbac';
import { assertShopManager } from '../shop/logic';
import {
    getProviderAttestationConfig,
    parseAttestationBody,
    serializeAttestationSettings,
    serializeEffectiveAttestation,
} from './logic';

const attestationSelect = {
    id: true,
    name: true,
    attestation_licensed: true,
    attestation_insured: true,
} as const;

export async function providerAttestationRoutes(fastify: FastifyInstance) {
    fastify.get('/api/provider-attestation/config', async (_request, reply) => {
        return reply.send(getProviderAttestationConfig());
    });

    fastify.get('/api/provider/attestation', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!canAccessBookingProviderTools(user.role, user.account_type)) {
            return reply.status(403).send({ error: 'Booking provider access required' });
        }

        const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        let shop: {
            id: string;
            name: string;
            attestation_licensed: boolean | null;
            attestation_insured: boolean | null;
        } | null = null;

        if (barber?.shop_id) {
            shop = await prisma.shops.findUnique({
                where: { id: barber.shop_id },
                select: attestationSelect,
            });
        }
        if (!shop) {
            shop = await prisma.shops.findFirst({
                where: { owner_id: user.id },
                select: attestationSelect,
            });
        }

        return {
            barber: barber ? serializeAttestationSettings(barber) : null,
            shop: shop ? serializeAttestationSettings(shop) : null,
        };
    });

    fastify.put<{ Body: { licensed?: boolean; insured?: boolean } }>(
        '/api/provider/barber/attestation',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;
            if (!canAccessBookingProviderTools(user.role, user.account_type)) {
                return reply.status(403).send({ error: 'Booking provider access required' });
            }
            const flags = parseAttestationBody(request.body ?? {});

            let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            if (!barber && canAccessBookingProviderTools(user.role, user.account_type)) {
                barber = await prisma.barbers.create({
                    data: {
                        user_id: user.id,
                        name: user.full_name || user.email || 'Barber',
                        attestation_licensed: flags.licensed,
                        attestation_insured: flags.insured,
                    },
                });
            }
            if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
            if (barber.user_id !== user.id && user.role !== 'admin') {
                return reply.status(403).send({ error: 'Not allowed' });
            }

            const updated = await prisma.barbers.update({
                where: { id: barber.id },
                data: {
                    attestation_licensed: flags.licensed,
                    attestation_insured: flags.insured,
                    updated_at: new Date().toISOString(),
                },
            });
            return serializeAttestationSettings(updated);
        }
    );

    fastify.put<{ Params: { shopId: string }; Body: { licensed?: boolean; insured?: boolean } }>(
        '/api/provider/shop/:shopId/attestation',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;
            const { shopId } = request.params;
            const flags = parseAttestationBody(request.body ?? {});

            const shop = await prisma.shops.findUnique({ where: { id: shopId } });
            if (!shop) return reply.status(404).send({ error: 'Shop not found' });

            const isOwner = shop.owner_id === user.id;
            if (!isOwner && user.role !== 'admin') {
                await assertShopManager(user, shopId, request.entityScopeCache);
            }

            const updated = await prisma.shops.update({
                where: { id: shopId },
                data: {
                    attestation_licensed: flags.licensed,
                    attestation_insured: flags.insured,
                    updated_at: new Date().toISOString(),
                },
            });
            return serializeAttestationSettings(updated);
        }
    );

    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/attestation', async (request, reply) => {
        const { id } = request.params;
        const barber = await prisma.barbers.findUnique({ where: { id } });
        if (!barber) return reply.status(404).send({ error: 'Barber not found' });

        let shop: {
            attestation_licensed: boolean | null;
            attestation_insured: boolean | null;
            name: string;
        } | null = null;
        if (barber.shop_id) {
            shop = await prisma.shops.findUnique({
                where: { id: barber.shop_id },
                select: {
                    attestation_licensed: true,
                    attestation_insured: true,
                    name: true,
                },
            });
        }
        return serializeEffectiveAttestation(barber, shop);
    });

    fastify.get<{ Params: { id: string } }>('/api/shops/:id/attestation', async (request, reply) => {
        const { id } = request.params;
        const shop = await prisma.shops.findUnique({ where: { id } });
        if (!shop) return reply.status(404).send({ error: 'Shop not found' });
        return serializeAttestationSettings(shop);
    });
}
