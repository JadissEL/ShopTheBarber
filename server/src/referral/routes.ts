import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    claimReferralCode,
    getReferralDashboard,
    validateReferralCode,
} from './logic';
import { programForRole, REFERRAL_PROGRAMS } from './config';

export async function referralRoutes(fastify: FastifyInstance) {
    fastify.get('/api/referral/programs', async (request) => {
        const role = (request.query as { role?: string })?.role ?? 'client';
        return {
            programs: programForRole(role),
            note: 'Double-sided rewards pay after your friend completes their qualifying action.',
        };
    });

    fastify.get<{ Params: { code: string } }>('/api/referral/validate/:code', async (request, reply) => {
        try {
            const referrer = await validateReferralCode(request.params.code);
            return {
                valid: true,
                referrer_name: referrer.full_name?.split(' ')[0] ?? 'A friend',
                programs: programForRole(referrer.role ?? 'client'),
            };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Invalid code';
            return reply.status(400).send({ valid: false, error: msg });
        }
    });

    fastify.get('/api/referral/me', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await getReferralDashboard(user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load referral data';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post<{ Body: { code?: string } }>('/api/referral/claim', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const code = request.body?.code?.trim();
        if (!code) return reply.status(400).send({ error: 'code is required' });
        try {
            return await claimReferralCode(user.id, code);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to apply referral code';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/referral/summary', async (_request, reply) => {
        return reply.send({
            client: REFERRAL_PROGRAMS.client_b2c,
            provider_client: REFERRAL_PROGRAMS.provider_client,
            pro_b2b: REFERRAL_PROGRAMS.pro_b2b,
        });
    });
}
