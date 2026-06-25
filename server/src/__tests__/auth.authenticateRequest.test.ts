/**
 * Bearer resolution: sovereign JWT attaches DB profile; Clerk JWT falls through verifyClerkToken.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyReply } from 'fastify';

import * as clerkMod from '../auth/clerk';
import { authenticateRequest } from '../auth/requestUser';
import { db } from '../db';

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(),
}));

function mockReply(): FastifyReply {
    const reply: Record<string, ReturnType<typeof vi.fn>> = {};
    reply.code = vi.fn(() => reply);
    reply.send = vi.fn(() => reply);
    return reply as unknown as FastifyReply;
}

describe('auth/authenticateRequest', () => {
    let findFirstSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.mocked(clerkMod.verifyClerkToken).mockReset();
        findFirstSpy = vi.spyOn(db.query.users, 'findFirst');
    });

    afterEach(() => {
        findFirstSpy.mockRestore();
    });

    it('returns false and 401 without Authorization', async () => {
        const req = { headers: {} } as Parameters<typeof authenticateRequest>[0];
        const reply = mockReply();
        const ok = await authenticateRequest(req, reply);
        expect(ok).toBe(false);
        expect((reply as any).code).toHaveBeenCalledWith(401);
    });

    it('JWT path: jwtVerify + DB row sets request.user from database', async () => {
        const uid = '11111111-1111-1111-1111-111111111111';
        const req: any = {
            headers: { authorization: 'Bearer sovereign.jwt' },
            jwtVerify: vi.fn(async () => {
                req.user = { id: uid };
            }),
        };
        findFirstSpy.mockResolvedValueOnce({
            id: uid,
            email: 'j@example.com',
            role: 'client',
        } as any);

        const reply = mockReply();
        const ok = await authenticateRequest(req, reply as any);
        expect(ok).toBe(true);
        expect(req.user).toEqual({ id: uid, email: 'j@example.com', role: 'client' });
        expect(clerkMod.verifyClerkToken).not.toHaveBeenCalled();
    });

    it('Clerk path: after JWT failure, maps verifyClerkToken to existing user by clerk id', async () => {
        const uid = '22222222-2222-2222-2222-222222222222';
        const req: any = {
            headers: { authorization: 'Bearer clerk.session' },
            jwtVerify: vi.fn(async () => {
                throw new Error('not a fastify jwt');
            }),
        };
        vi.mocked(clerkMod.verifyClerkToken).mockResolvedValue({
            id: 'clerk_user_xyz',
            email: 'c@example.com',
            role: 'client',
        });
        findFirstSpy.mockResolvedValueOnce({
            id: uid,
            email: 'c@example.com',
            clerk_user_id: 'clerk_user_xyz',
            role: 'client',
        } as any);

        const reply = mockReply();
        const ok = await authenticateRequest(req, reply as any);
        expect(ok).toBe(true);
        expect(req.user).toEqual({ id: uid, email: 'c@example.com', role: 'client' });
        expect(clerkMod.verifyClerkToken).toHaveBeenCalledWith('clerk.session');
    });

    it('Clerk path: invalid Clerk token returns 401', async () => {
        const req: any = {
            headers: { authorization: 'Bearer bad' },
            jwtVerify: vi.fn(async () => {
                throw new Error('not jwt');
            }),
        };
        vi.mocked(clerkMod.verifyClerkToken).mockResolvedValue(null);
        const reply = mockReply();
        const ok = await authenticateRequest(req, reply as any);
        expect(ok).toBe(false);
        expect((reply as any).code).toHaveBeenCalledWith(401);
    });
});
