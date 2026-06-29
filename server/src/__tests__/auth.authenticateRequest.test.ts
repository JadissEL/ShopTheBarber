/**
 * Clerk-only Bearer resolution: verifyClerkToken → DB user (link by clerk id / email / provision).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyReply } from 'fastify';

import * as clerkMod from '../auth/clerk';
import { authenticateRequest } from '../auth/requestUser';
import { prisma } from '../db/prisma';

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(),
}));

function mockReply(): FastifyReply {
    const reply: Record<string, ReturnType<typeof vi.fn>> = {};
    reply.code = vi.fn(() => reply);
    reply.send = vi.fn(() => reply);
    return reply as unknown as FastifyReply;
}

describe('auth/authenticateRequest (Clerk-only)', () => {
    beforeEach(() => {
        vi.mocked(clerkMod.verifyClerkToken).mockReset();
        vi.restoreAllMocks();
    });

    it('returns false and 401 without Authorization', async () => {
        const req = { headers: {} } as Parameters<typeof authenticateRequest>[0];
        const reply = mockReply();
        const ok = await authenticateRequest(req, reply);
        expect(ok).toBe(false);
        expect((reply as any).code).toHaveBeenCalledWith(401);
    });

    it('maps a valid Clerk token to an existing user by clerk id', async () => {
        const uid = '22222222-2222-2222-2222-222222222222';
        vi.spyOn(prisma.users, 'findUnique').mockResolvedValueOnce({
            id: uid,
            email: 'c@example.com',
            clerk_user_id: 'clerk_user_xyz',
            role: 'client',
        } as any);
        vi.mocked(clerkMod.verifyClerkToken).mockResolvedValue({
            id: 'clerk_user_xyz',
            email: 'c@example.com',
            role: 'client',
        });

        const req: any = { headers: { authorization: 'Bearer clerk.session' } };
        const reply = mockReply();
        const ok = await authenticateRequest(req, reply);
        expect(ok).toBe(true);
        expect(req.user).toEqual({ id: uid, email: 'c@example.com', role: 'client' });
        expect(clerkMod.verifyClerkToken).toHaveBeenCalledWith('clerk.session');
    });

    it('returns 401 for an invalid Clerk token', async () => {
        vi.mocked(clerkMod.verifyClerkToken).mockResolvedValue(null);
        const req: any = { headers: { authorization: 'Bearer bad' } };
        const reply = mockReply();
        const ok = await authenticateRequest(req, reply);
        expect(ok).toBe(false);
        expect((reply as any).code).toHaveBeenCalledWith(401);
    });
});
