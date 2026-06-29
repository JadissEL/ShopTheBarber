/**
 * Smoke: messaging API (threads, send, write protection).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_msg_${Date.now()}`;
const EMAIL = `msg-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Message Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: messages API', () => {
    let userId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.messages.deleteMany({
                where: { OR: [{ sender_id: userId }, { receiver_id: userId }] },
            });
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/messages/threads requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/messages/threads' });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/messages/threads returns array for authenticated user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/messages/threads',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        expect(userId).toBeTruthy();
    });

    it('blocks direct entity writes to messages', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/messages',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { sender_id: userId, receiver_id: userId, content: 'hi' },
        });
        expect(res.statusCode).toBe(403);
    });

    it('GET /api/messages/resolve-contact requires params', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/messages/resolve-contact',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(400);
    });
});
