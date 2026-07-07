/**
 * Booking providers may create services via generic entity API.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_barber_entity_${Date.now()}`;
const EMAIL = `barber-entity-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Barber Entity',
        avatar_url: null,
        account_type: 'solo_barber',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('integration: generic entity write RBAC (solo barber)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let barberId: string;
    let userId: string;
    let serviceId: string | undefined;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'solo_barber',
            fullName: 'Barber Entity',
        });
        userId = user.id;
        const barber = await prisma.barbers.create({
            data: {
                user_id: userId,
                name: 'Solo Barber',
                title: 'Independent Barber',
                updated_at: new Date().toISOString(),
            },
        });
        barberId = barber.id;
    });

    afterAll(async () => {
        if (serviceId) {
            await prisma.services.delete({ where: { id: serviceId } }).catch(() => undefined);
        } else {
            await prisma.services.deleteMany({ where: { barber_id: barberId } }).catch(() => undefined);
        }
        await prisma.barbers.deleteMany({ where: { user_id: userId } });
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('allows solo barber POST /api/services', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: authHeaders,
            payload: {
                name: 'Fade',
                price: 30,
                duration_minutes: 45,
                barber_id: barberId,
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        const body = res.json() as { id?: string };
        serviceId = body.id;
    });
});
