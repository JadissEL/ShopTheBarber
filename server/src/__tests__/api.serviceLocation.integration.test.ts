/**
 * Service location settings — in-shop, at-home, or both.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_sl_${Date.now()}`;
const EMAIL = `sl-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Location Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: service-location API', () => {
    let userId: string;
    let barberId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/service-location/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/service-location/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.shop_label).toBe('In-shop visits');
        expect(body.mobile_label).toBe('At-home visits');
    });

    it('defaults to shop-only for new barber profile via GET provider', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const getRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider/service-locations',
            headers: authHeaders,
        });
        expect(getRes.statusCode).toBe(200);
        const body = JSON.parse(getRes.payload);
        expect(body.barber?.shop_only ?? body.shop_only).toBe(true);
    });

    it('PUT enables both modes and GET reflects them', async () => {
        const putRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/service-locations',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_shop_service: true, offers_mobile_service: true },
        });
        expect(putRes.statusCode).toBe(200);
        const putBody = JSON.parse(putRes.payload);
        barberId = putBody.id;
        expect(putBody.offers_shop_service).toBe(true);
        expect(putBody.offers_mobile_service).toBe(true);
        expect(putBody.both).toBe(true);

        const getRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/service-locations`,
        });
        expect(getRes.statusCode).toBe(200);
        expect(JSON.parse(getRes.payload).both).toBe(true);
    });

    it('rejects disabling both shop and mobile', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/service-locations',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_shop_service: false, offers_mobile_service: false },
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload).error).toMatch(/at least one/i);
    });

    it('supports mobile-only mode', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/service-locations',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_shop_service: false, offers_mobile_service: true },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.mobile_only).toBe(true);
        expect(body.shop_only).toBe(false);
    });

    it('legacy mobile-service PUT cannot leave barber with no modes', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/mobile-service',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_mobile_service: false },
        });
        expect(res.statusCode).toBe(400);
    });
});
