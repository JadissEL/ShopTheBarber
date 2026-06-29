/**
 * Smoke: platform support chat API.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_support_${Date.now()}`;
const EMAIL = `support-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Support Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: support API', () => {
    let userId: string;
    let adminId: string;
    let ticketId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (ticketId) {
            await prisma.messages.deleteMany({ where: { support_ticket_id: ticketId } });
            await prisma.support_tickets.deleteMany({ where: { id: ticketId } });
        }
        if (userId) {
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        if (adminId) {
            await prisma.notifications.deleteMany({ where: { user_id: adminId } });
            await prisma.users.deleteMany({ where: { id: adminId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/support/desk requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/support/desk' });
        expect(res.statusCode).toBe(401);
    });

    it('creates admin desk user and returns desk info', async () => {
        adminId = crypto.randomUUID();
        await prisma.users.create({
            data: {
                id: adminId,
                clerk_user_id: `admin_${Date.now()}`,
                email: `admin-support-${Date.now()}@example.com`,
                full_name: 'Support Desk',
                role: 'admin',
            },
        });

        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/support/desk',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.display_name).toBe('ShopTheBarber Support');
        expect(Array.isArray(body.categories)).toBe(true);

        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        expect(userId).toBeTruthy();
    });

    it('POST /api/support/tickets creates ticket with first message', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/support/tickets',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                subject: 'Test help request',
                category: 'general',
                content: 'I need assistance with my account.',
            },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.ticket?.id).toBeTruthy();
        expect(body.ticket.subject).toBe('Test help request');
        expect(body.message?.content).toContain('assistance');
        ticketId = body.ticket.id;
    });

    it('GET /api/support/tickets lists user tickets', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/support/tickets',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        expect(body.some((t: { id: string }) => t.id === ticketId)).toBe(true);
    });

    it('GET /api/support/admin/tickets forbidden for client', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/support/admin/tickets',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });
});
