/**
 * Provider attestation (Licensed / Insured) for barbers and shops.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_att_${Date.now()}`;
const EMAIL = `att-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Attestation Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { effectiveAttestation } from '../providerAttestation/logic';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('providerAttestation logic', () => {
    it('effectiveAttestation is true if barber OR shop declares flag', () => {
        expect(effectiveAttestation(false, false)).toBe(false);
        expect(effectiveAttestation(true, false)).toBe(true);
        expect(effectiveAttestation(false, true)).toBe(true);
    });
});

describe('integration: provider attestation API', () => {
    let userId: string;
    let barberId: string;
    let shopId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'solo_barber',
            fullName: 'Attestation Barber',
        });
    });

    afterAll(async () => {
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (shopId) await prisma.shops.deleteMany({ where: { id: shopId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/provider-attestation/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider-attestation/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.licensed.label).toBe('Licensed');
        expect(body.insured.label).toBe('Insured');
    });

    it('PUT barber and shop attestation, GET effective', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const barberRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/attestation',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { licensed: true, insured: false },
        });
        expect(barberRes.statusCode).toBe(200);
        barberId = JSON.parse(barberRes.payload).id;
        expect(JSON.parse(barberRes.payload).licensed).toBe(true);
        expect(JSON.parse(barberRes.payload).insured).toBe(false);

        const shop = await prisma.shops.create({
            data: {
                name: 'Insured Cuts',
                owner_id: userId,
                attestation_licensed: false,
                attestation_insured: false,
            },
        });
        shopId = shop.id;
        await prisma.barbers.update({
            where: { id: barberId },
            data: { shop_id: shopId },
        });

        const shopRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: `/api/provider/shop/${shopId}/attestation`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { licensed: false, insured: true },
        });
        expect(shopRes.statusCode).toBe(200);
        expect(JSON.parse(shopRes.payload).insured).toBe(true);

        const effectiveRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/attestation`,
        });
        expect(effectiveRes.statusCode).toBe(200);
        const effective = JSON.parse(effectiveRes.payload);
        expect(effective.licensed).toBe(true);
        expect(effective.insured).toBe(true);
        expect(effective.barber_licensed).toBe(true);
        expect(effective.shop_insured).toBe(true);

        const shopPublic = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/shops/${shopId}/attestation`,
        });
        expect(shopPublic.statusCode).toBe(200);
        expect(JSON.parse(shopPublic.payload).insured).toBe(true);
    });
});
