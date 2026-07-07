/**
 * Spec §7: Company jobs allowed; services denied; products gated by commerce.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_company_spec_${Date.now()}`;
const EMAIL = `company-spec-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'company',
        full_name: 'Company Spec',
        avatar_url: null,
        account_type: 'company',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedCompanyWorkspace, seedProvisionedUser } from './helpers/integrationUser';

describe('integration: company role scenarios (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let jobId: string | undefined;
    let productId: string | undefined;
    let userId: string;
    let companyId: string;
    let prevCommerceEnv: string | undefined;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'company',
            fullName: 'Company Spec',
        });
        userId = user.id;
        const workspace = await seedCompanyWorkspace(user.id);
        companyId = workspace.companyId;
    });

    afterAll(async () => {
        if (jobId) await prisma.jobs.delete({ where: { id: jobId } }).catch(() => undefined);
        if (productId) await prisma.products.delete({ where: { id: productId } }).catch(() => undefined);
        await prisma.company_accounts.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.companies.deleteMany({ where: { id: companyId } }).catch(() => undefined);
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        if (prevCommerceEnv === undefined) delete process.env.COMPANY_COMMERCE_USER_IDS;
        else process.env.COMPANY_COMMERCE_USER_IDS = prevCommerceEnv;
        await (app as FastifyInstance).close();
    });

    it('allows company POST /api/jobs', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/jobs',
            headers: authHeaders,
            payload: {
                title: 'Company Spec Role',
                category: 'management',
                employer_type: 'company',
                company_id: companyId,
                employment_type: 'full_time',
                location_type: 'on_site',
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        jobId = (res.json() as { id?: string }).id;
    });

    it('rejects company POST /api/services', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: authHeaders,
            payload: { name: 'Forbidden Service', price: 20, duration_minutes: 30 },
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects company POST /api/products when commerce inactive', async () => {
        prevCommerceEnv = process.env.COMPANY_COMMERCE_USER_IDS;
        process.env.COMPANY_COMMERCE_USER_IDS = '';
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: { name: 'Company Product', price: 49.99 },
        });
        expect(res.statusCode).toBe(403);
    });

    it('allows company POST /api/products when commerce is active', async () => {
        prevCommerceEnv = process.env.COMPANY_COMMERCE_USER_IDS;
        process.env.COMPANY_COMMERCE_USER_IDS = userId;
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: { name: 'Company Commerce Product', price: 59.99, category: 'tools' },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        productId = (res.json() as { id?: string }).id;
    });
});
