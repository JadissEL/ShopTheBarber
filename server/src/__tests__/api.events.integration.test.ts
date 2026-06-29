/**
 * Smoke: platform events & webinars API.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

const CLERK_ID = `clerk_events_${Date.now()}`;
const EMAIL = `events-int-${Date.now()}@example.com`;

let mockRole = 'barber';

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: mockRole,
        full_name: 'Events Test Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: events API', () => {
    let userId: string;
    let adminId: string;
    let eventId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (eventId) {
            await prisma.event_registrations.deleteMany({ where: { event_id: eventId } });
            await prisma.platform_events.deleteMany({ where: { id: eventId } });
        }
        if (userId) {
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        if (adminId) {
            await prisma.users.deleteMany({ where: { id: adminId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/events/config is public', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/events/config' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.event_types)).toBe(true);
        expect(Array.isArray(body.audiences)).toBe(true);
    });

    it('GET /api/events/provider requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/events/provider' });
        expect(res.statusCode).toBe(401);
    });

    it('admin creates published event', async () => {
        mockRole = 'admin';
        adminId = crypto.randomUUID();
        await prisma.users.upsert({
            where: { clerk_user_id: CLERK_ID },
            create: {
                id: adminId,
                clerk_user_id: CLERK_ID,
                email: EMAIL,
                full_name: 'Events Admin',
                role: 'admin',
            },
            update: { role: 'admin' },
        });

        const start = new Date();
        start.setDate(start.getDate() + 14);

        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/events/admin',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                title: 'Integration Webinar',
                description: 'Test webinar for barbers',
                event_type: 'webinar',
                format: 'online',
                start_at: start.toISOString(),
                meeting_url: 'https://example.com/join',
                max_capacity: 50,
                target_audience: 'all_providers',
                status: 'published',
            },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.title).toBe('Integration Webinar');
        eventId = body.id;
    });

    it('barber lists and registers for event', async () => {
        mockRole = 'barber';
        await prisma.users.updateMany({
            where: { clerk_user_id: CLERK_ID },
            data: { role: 'barber' },
        });

        const listRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/events/provider',
            headers: authHeaders,
        });
        expect(listRes.statusCode).toBe(200);
        const list = JSON.parse(listRes.payload);
        expect(list.some((e: { id: string }) => e.id === eventId)).toBe(true);

        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        expect(userId).toBeTruthy();

        const regRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/events/${eventId}/register`,
            headers: authHeaders,
        });
        expect(regRes.statusCode).toBe(200);
        const regBody = JSON.parse(regRes.payload);
        expect(regBody.status).toBe('registered');

        const detailRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/events/${eventId}`,
            headers: authHeaders,
        });
        expect(detailRes.statusCode).toBe(200);
        const detail = JSON.parse(detailRes.payload);
        expect(detail.meeting_url).toBe('https://example.com/join');
    });

    it('GET /api/events/admin/list forbidden for barber', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/events/admin/list',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });
});
