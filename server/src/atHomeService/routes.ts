import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { isProviderRole } from '../auth/platformRbac';
import { assertShopManager } from '../shop/logic';
import {
    DEFAULT_TRAVEL_ZONES,
    getProviderAtHomeSettings,
    getPublicAtHomeArea,
    quoteAtHomeTravel,
    resolveAtHomeArea,
    serializeAtHomeArea,
    upsertBarberAtHomeArea,
    upsertShopAtHomeArea,
    type AtHomeAreaInput,
    type TravelZoneInput,
} from './logic';
import { geocodeAddress, reverseGeocode, suggestAddresses, getGeocodingConfig } from './geocoding';
import { isIpRateLimitAllowed } from '../lib/ipRateLimit';

function parseAreaBody(body: Record<string, unknown>): AtHomeAreaInput {
    const zones = Array.isArray(body.zones)
        ? (body.zones as TravelZoneInput[]).map((z, i) => ({
              label: String(z.label ?? `Zone ${i + 1}`),
              min_distance_km: Number(z.min_distance_km ?? 0),
              max_distance_km: Number(z.max_distance_km),
              fee_amount: Number(z.fee_amount ?? 0),
              sort_order: Number(z.sort_order ?? i),
          }))
        : undefined;

    return {
        base_address: typeof body.base_address === 'string' ? body.base_address : undefined,
        base_latitude: body.base_latitude != null ? Number(body.base_latitude) : undefined,
        base_longitude: body.base_longitude != null ? Number(body.base_longitude) : undefined,
        service_radius_km: body.service_radius_km != null ? Number(body.service_radius_km) : undefined,
        travel_fees_enabled: body.travel_fees_enabled === true,
        zones,
    };
}

export async function atHomeServiceRoutes(fastify: FastifyInstance) {
    fastify.get('/api/at-home-service/config', async () => ({
        label: 'At-home travel zones',
        description:
            'Set your service radius, geocode your base location, and charge travel fees by distance, for at-home visits only.',
        default_zones: DEFAULT_TRAVEL_ZONES,
        geocoding: getGeocodingConfig(),
    }));

    fastify.get('/api/provider/at-home-service', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!isProviderRole(user.role)) {
            return reply.status(403).send({ error: 'Provider access required' });
        }
        return getProviderAtHomeSettings(user.id);
    });

    fastify.put<{ Body: AtHomeAreaInput }>(
        '/api/provider/barber/at-home-service',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;

            const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
            if (barber.user_id !== user.id && user.role !== 'admin') {
                return reply.status(403).send({ error: 'Not allowed' });
            }

            try {
                const area = await upsertBarberAtHomeArea(barber.id, parseAreaBody(request.body ?? {}));
                if (!area) return reply.status(500).send({ error: 'Failed to save area' });
                return serializeAtHomeArea(area, { type: 'barber', id: barber.id, name: barber.name });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to save at-home service area';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.put<{ Params: { shopId: string }; Body: AtHomeAreaInput }>(
        '/api/provider/shop/:shopId/at-home-service',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;
            const { shopId } = request.params;

            const shop = await prisma.shops.findUnique({ where: { id: shopId } });
            if (!shop) return reply.status(404).send({ error: 'Shop not found' });

            const isOwner = shop.owner_id === user.id;
            if (!isOwner && user.role !== 'admin') {
                await assertShopManager(user, shopId, request.entityScopeCache);
            }

            try {
                const area = await upsertShopAtHomeArea(shopId, parseAreaBody(request.body ?? {}));
                if (!area) return reply.status(500).send({ error: 'Failed to save area' });
                return serializeAtHomeArea(area, { type: 'shop', id: shop.id, name: shop.name });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to save shop at-home area';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Querystring: { q?: string } }>(
        '/api/at-home-service/suggest',
        async (request, reply) => {
            const ip = request.ip || 'unknown';
            if (!(await isIpRateLimitAllowed('geocode-suggest', ip, 30, 60_000))) {
                return reply.status(429).send({ error: 'Too many address lookups. Please wait a moment.' });
            }
            const q = request.query.q?.trim() ?? '';
            if (q.length < 3) {
                return { suggestions: [] as Array<{ label: string; formatted_address: string; latitude: number; longitude: number }> };
            }
            const suggestions = await suggestAddresses(q);
            return { suggestions };
        }
    );

    fastify.post<{ Body: { address?: string } }>(
        '/api/at-home-service/geocode',
        async (request, reply) => {
            const ip = request.ip || 'unknown';
            if (!(await isIpRateLimitAllowed('geocode', ip, 20, 60_000))) {
                return reply.status(429).send({ error: 'Too many geocode requests. Please wait a moment.' });
            }
            const address = request.body?.address?.trim();
            if (!address) return reply.status(400).send({ error: 'Address is required' });
            try {
                return await geocodeAddress(address);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Geocoding failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Body: { latitude: number; longitude: number } }>(
        '/api/at-home-service/reverse-geocode',
        async (request, reply) => {
            const ip = request.ip || 'unknown';
            if (!(await isIpRateLimitAllowed('revgeo', ip, 20, 60_000))) {
                return reply.status(429).send({ error: 'Too many requests. Please wait a moment.' });
            }
            const lat = Number(request.body?.latitude);
            const lng = Number(request.body?.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return reply.status(400).send({ error: 'Valid latitude and longitude required' });
            }
            try {
                return await reverseGeocode(lat, lng);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Reverse geocoding failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{
        Body: {
            barber_id: string;
            shop_id?: string;
            context_type?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
        };
    }>('/api/at-home-service/quote', async (request, reply) => {
        const ip = request.ip || 'unknown';
        if (!(await isIpRateLimitAllowed('at-home-quote', ip, 40, 60_000))) {
            return reply.status(429).send({ error: 'Too many quote requests. Please wait a moment.' });
        }

        const barberId = request.body?.barber_id;
        if (!barberId) return reply.status(400).send({ error: 'barber_id is required' });

        try {
            const resolved = await resolveAtHomeArea({
                barberId,
                shopId: request.body?.shop_id,
                contextType: request.body?.context_type,
            });
            if (!resolved) {
                return {
                    in_service_area: true,
                    distance_km: null,
                    travel_fee: 0,
                    zone_label: null,
                    service_radius_km: null,
                    travel_fees_enabled: false,
                    owner_type: null,
                    configured: false,
                };
            }

            const quote = await quoteAtHomeTravel({
                barberId,
                shopId: request.body?.shop_id,
                contextType: request.body?.context_type,
                address: request.body?.address,
                latitude: request.body?.latitude,
                longitude: request.body?.longitude,
            });
            return { ...quote, configured: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Travel quote failed';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get<{ Params: { id: string }; Querystring: { shop_id?: string; context_type?: string } }>(
        '/api/barbers/:id/at-home-service',
        async (request, _reply) => {
            const area = await getPublicAtHomeArea({
                barberId: request.params.id,
                shopId: request.query.shop_id,
                contextType: request.query.context_type,
            });
            if (!area) return { configured: false };
            return { configured: true, ...area };
        }
    );

    fastify.get<{ Params: { id: string } }>(
        '/api/shops/:id/at-home-service',
        async (request, reply) => {
            const shop = await prisma.shops.findUnique({
                where: { id: request.params.id },
                select: { id: true, name: true, offers_mobile_service: true },
            });
            if (!shop) return reply.status(404).send({ error: 'Shop not found' });
            const area = await prisma.at_home_service_areas.findUnique({
                where: { shop_id: shop.id },
                include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
            });
            if (!area) return { configured: false };
            return { configured: true, ...serializeAtHomeArea(area, { type: 'shop', id: shop.id, name: shop.name }) };
        }
    );
}
