import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { getProgramPublicConfig } from './config';
import { getLoyaltySummary, redeemReward, calculateEarnedPoints, getMyActiveRewardCodes } from './logic';

type AuthUser = { id: string };

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

export async function loyaltyRoutes(fastify: FastifyInstance) {
    fastify.get('/api/loyalty/program', async () => {
        return getProgramPublicConfig();
    });

    fastify.get('/api/loyalty/preview', async (request, reply) => {
        const amount = Number((request.query as { amount?: string }).amount);
        const tier = (request.query as { tier?: string }).tier ?? 'Bronze';
        if (!Number.isFinite(amount) || amount <= 0) {
            return reply.status(400).send({ error: 'amount must be a positive number' });
        }
        const points = calculateEarnedPoints(amount, tier);
        return {
            amount_usd: amount,
            points_earned: points,
            tier,
            dollar_value_if_redeemed: Math.round(((points * 2) / 100) * 100) / 100,
        };
    });

    fastify.get('/api/loyalty/me', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        return getLoyaltySummary(user.id);
    });

    fastify.get('/api/loyalty/my-codes', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        return { codes: await getMyActiveRewardCodes(user.id) };
    });

    fastify.post<{ Body: { reward_id: string } }>('/api/loyalty/redeem', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const rewardId = request.body?.reward_id;
        if (!rewardId) return reply.status(400).send({ error: 'reward_id is required' });
        try {
            return await redeemReward(user.id, rewardId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to redeem reward';
            return reply.status(400).send({ error: msg });
        }
    });
}
