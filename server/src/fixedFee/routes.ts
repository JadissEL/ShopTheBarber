import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    cancelFixedFeePlanAdmin,
    createFixedFeeCheckout,
    getFixedFeeConfig,
    getFixedFeeQuote,
    getProviderFixedFeeStatus,
    listAdminFixedFeePlans,
    renewMonthlyFixedFeePlan,
    runFixedFeeMaintenance,
    type AuthUser,
} from './logic';
import { BILLING_CYCLES, PLAN_SCOPES, type BillingCycle, type PlanScope } from './config';

async function requireAuth(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireAdmin(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (user.role !== 'admin') {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return user;
}

function parseScope(value: unknown): PlanScope {
    const s = String(value ?? '');
    if (!PLAN_SCOPES.includes(s as PlanScope)) throw new Error('Invalid scope');
    return s as PlanScope;
}

function parseBillingCycle(value: unknown): BillingCycle {
    const b = String(value ?? '');
    if (!BILLING_CYCLES.includes(b as BillingCycle)) throw new Error('Invalid billing cycle');
    return b as BillingCycle;
}

export async function fixedFeeRoutes(fastify: FastifyInstance) {
    fastify.get('/api/fixed-fee/config', async () => getFixedFeeConfig());

    fastify.get<{ Querystring: { scope: string; billing_cycle: string } }>(
        '/api/fixed-fee/quote',
        async (request, reply) => {
            try {
                const scope = parseScope(request.query.scope);
                const billingCycle = parseBillingCycle(request.query.billing_cycle);
                return await getFixedFeeQuote(scope, billingCycle);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid quote request';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Querystring: { shop_id?: string } }>('/api/fixed-fee/me', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await getProviderFixedFeeStatus(user.id, user.role, request.query.shop_id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load fixed-fee status';
            return reply.status(403).send({ error: msg });
        }
    });

    fastify.post<{ Body: { scope?: string; billing_cycle?: string; shop_id?: string } }>(
        '/api/fixed-fee/subscribe',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                const scope = parseScope(request.body?.scope);
                const billingCycle = parseBillingCycle(request.body?.billing_cycle);
                return await createFixedFeeCheckout(
                    user.id,
                    user.role,
                    scope,
                    billingCycle,
                    request.body?.shop_id
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Subscription failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Body: { scope?: string } }>('/api/fixed-fee/renew-monthly', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            const scope = parseScope(request.body?.scope);
            return await renewMonthlyFixedFeePlan(user.id, user.role, scope);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Renewal failed';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/fixed-fee/admin/plans', async (request, reply) => {
        const admin = await requireAdmin(request, reply);
        if (!admin) return;
        return listAdminFixedFeePlans();
    });

    fastify.post<{ Params: { planId: string } }>(
        '/api/fixed-fee/admin/plans/:planId/cancel',
        async (request, reply) => {
            const admin = await requireAdmin(request, reply);
            if (!admin) return;
            try {
                return await cancelFixedFeePlanAdmin(request.params.planId, admin.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Cancel failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post('/api/fixed-fee/admin/maintenance', async (request, reply) => {
        const admin = await requireAdmin(request, reply);
        if (!admin) return;
        return runFixedFeeMaintenance();
    });
}
