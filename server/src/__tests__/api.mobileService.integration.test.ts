/**
 * Mobile / at-home barber service settings.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_ms_${Date.now()}`;
const EMAIL = `ms-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Mobile Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

function matchesMobileServiceFilter(
    offersMobile: boolean | null | undefined,
    mobileOnly: boolean
): boolean {
    if (!mobileOnly) return true;
    return offersMobile === true;
}

describe('mobileService filter helper', () => {
    it('matchesMobileServiceFilter passes when filter off', () => {
        expect(matchesMobileServiceFilter(false, false)).toBe(true);
        expect(matchesMobileServiceFilter(true, false)).toBe(true);
    });

    it('matchesMobileServiceFilter requires flag when filter on', () => {
        expect(matchesMobileServiceFilter(true, true)).toBe(true);
        expect(matchesMobileServiceFilter(false, true)).toBe(false);
    });
});

describe('integration: mobile-service API', () => {
    let userId: string;
    let barberId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/mobile-service/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/mobile-service/config',
        });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.payload).label).toBe('At-home visits');
    });

    it('PUT barber mobile-service and GET effective', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const putRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/mobile-service',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_mobile_service: true },
        });
        expect(putRes.statusCode).toBe(200);
        const putBody = JSON.parse(putRes.payload);
        barberId = putBody.barber_id;
        expect(putBody.offers_mobile_service).toBe(true);

        const getRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/mobile-service`,
        });
        expect(getRes.statusCode).toBe(200);
        expect(JSON.parse(getRes.payload).offers_mobile_service).toBe(true);

        const homeRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/home',
        });
        expect(homeRes.statusCode).toBe(200);
        const home = JSON.parse(homeRes.payload);
        expect(Array.isArray(home.mobile_barbers)).toBe(true);

        const stored = await prisma.barbers.findUnique({
            where: { id: barberId },
            select: { offers_mobile_service: true },
        });
        expect(stored?.offers_mobile_service).toBe(true);
    });
});
