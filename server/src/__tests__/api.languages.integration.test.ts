/**
 * Spoken languages for barbers and shops.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const PROVIDER_CLERK = `clerk_lang_provider_${Date.now()}`;
const PROVIDER_EMAIL = `lang-provider-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: PROVIDER_CLERK,
        email: PROVIDER_EMAIL,
        role: 'barber',
        full_name: 'Lang Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { normalizeLanguageInput, parseSpokenLanguages } from '../languages/logic';

describe('languages logic', () => {
    it('normalizeLanguageInput validates supported codes', () => {
        expect(normalizeLanguageInput(['en', 'fr', 'el'])).toEqual(['en', 'fr', 'el']);
        expect(normalizeLanguageInput(['en', 'xx', 'fr'])).toEqual(['en', 'fr']);
    });

    it('parseSpokenLanguages reads JSON arrays', () => {
        expect(parseSpokenLanguages(JSON.stringify(['en', 'el']))).toEqual(['en', 'el']);
    });
});

describe('integration: languages API', () => {
    let userId: string;
    let barberId: string;
    let shopId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (shopId) await prisma.shops.deleteMany({ where: { id: shopId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/languages/options is public', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/languages/options' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        expect(body.some((l: { code: string }) => l.code === 'en')).toBe(true);
    });

    it('PUT barber and shop languages, GET effective languages', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const barberRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/languages',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { languages: ['en', 'el'] },
        });
        expect(barberRes.statusCode).toBe(200);
        const barberBody = JSON.parse(barberRes.payload);
        barberId = barberBody.id;
        expect(barberBody.spoken_languages).toEqual(['en', 'el']);

        const shop = await prisma.shops.create({
            data: {
                name: 'Language Test Shop',
                owner_id: userId,
                spoken_languages: JSON.stringify(['fr']),
            },
        });
        shopId = shop.id;

        const shopRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: `/api/provider/shop/${shopId}/languages`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { languages: ['fr', 'en'] },
        });
        expect(shopRes.statusCode).toBe(200);

        await prisma.barbers.update({
            where: { id: barberId },
            data: { shop_id: shopId },
        });

        const effectiveRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/languages`,
        });
        expect(effectiveRes.statusCode).toBe(200);
        const effective = JSON.parse(effectiveRes.payload);
        expect(effective.effective_languages.sort()).toEqual(['el', 'en', 'fr'].sort());
    });
});
