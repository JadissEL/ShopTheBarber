/**
 * Signup intent + provision flow (immutable account types).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_provision_${Date.now()}`;
const EMAIL = `provision-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Provision Test',
        avatar_url: null,
        account_type: null,
    })),
}));

vi.mock('@clerk/backend', () => ({
    createClerkClient: () => ({
        users: {
            updateUserMetadata: vi.fn(async () => ({})),
        },
    }),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: auth provision API', () => {
    let userId: string;
    let intentToken: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.seller_profiles.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await prisma.signup_intents.deleteMany({});
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('POST /api/auth/signup-intent creates a token', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/auth/signup-intent',
            headers: { 'content-type': 'application/json' },
            payload: { accountType: 'seller' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.token).toBeTruthy();
        expect(body.accountType).toBe('seller');
        intentToken = body.token;
    });

    it('GET /api/auth/me returns needsProvision before provision', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.needsProvision).toBe(true);
        expect(body.email).toBe(EMAIL);
        expect(body.id).toBeUndefined();
    });

    it('POST /api/auth/provision creates locked seller account', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/auth/provision',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { accountType: 'seller', signupIntentToken: intentToken },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.account_type).toBe('seller');
        expect(body.role).toBe('seller');
        expect(body.needsProvision).toBe(false);
        expect(body.dashboardPath).toBe('/SellerDashboard');
        userId = body.id;
    });

    it('rejects conflicting account type for same email', async () => {
        const intentRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/auth/signup-intent',
            headers: { 'content-type': 'application/json' },
            payload: { accountType: 'blogger' },
        });
        const token = JSON.parse(intentRes.payload).token;

        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/auth/provision',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { accountType: 'blogger', signupIntentToken: token },
        });
        expect(res.statusCode).toBe(409);
        const body = JSON.parse(res.payload);
        expect(body.code).toBe('ACCOUNT_TYPE_CONFLICT');
    });

    it('GET /api/auth/me returns provisioned user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.id).toBe(userId);
        expect(body.account_type).toBe('seller');
        expect(body.needsProvision).toBe(false);
    });
});
