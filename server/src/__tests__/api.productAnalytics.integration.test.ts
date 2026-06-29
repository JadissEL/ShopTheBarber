/**
 * Product analytics — event tracking + admin dashboard metrics.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_pa_${Date.now()}`;
const EMAIL = `pa-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'admin',
        full_name: 'Analytics Admin',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: product analytics', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    const eventIds: string[] = [];

    afterAll(async () => {
        if (eventIds.length) {
            await prisma.product_analytics_events.deleteMany({ where: { id: { in: eventIds } } });
        }
        await (app as FastifyInstance).close();
    });

    it('POST /api/analytics/track accepts anonymous events', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/analytics/track',
            headers: { 'content-type': 'application/json' },
            payload: {
                event_name: 'view_home',
                session_id: `test_sess_${Date.now()}`,
                properties: { source: 'vitest' },
            },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.ok).toBe(true);
        eventIds.push(body.id);
    });

    it('GET /api/admin/analytics/dashboard requires admin', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/admin/analytics/dashboard?days=30',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.funnel).toBeDefined();
        expect(body.ltv).toBeDefined();
        expect(body.fee_adoption).toBeDefined();
        expect(body.marketplace_attachment).toBeDefined();
        expect(Array.isArray(body.funnel.steps)).toBe(true);
        expect(body.funnel.daily_trend).toBeDefined();
        expect(body.trends?.ltv_monthly).toBeDefined();
        expect(body.analytics_events?.counts).toBeDefined();
        expect(body.cohorts?.signup_retention_curve).toBeDefined();
        if (body.funnel.steps.length > 0) {
            expect(body.funnel.steps[0]).toHaveProperty('strict_sessions');
        }
    });
});
