import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    submitReview,
    submitReviewByToken,
    getBookingReviewStatus,
    listPublicReviews,
    listProviderReviews,
    type ReviewTargetType,
} from './logic';
import {
    getReviewRequestByToken,
    listPendingReviewsForUser,
    processReviewNudges,
} from './requestLogic';

type AuthUser = { id: string };

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

function parseTargetType(value: string | undefined): ReviewTargetType | null {
    if (value === 'barber' || value === 'shop') return value;
    return null;
}

export async function reviewRoutes(fastify: FastifyInstance) {
    fastify.get('/api/reviews/public', async (request, reply) => {
        const q = request.query as {
            target_type?: string;
            target_id?: string;
            limit?: string;
            offset?: string;
            min_rating?: string;
        };
        const targetType = parseTargetType(q.target_type);
        if (!targetType || !q.target_id) {
            return reply.status(400).send({ error: 'target_type (barber|shop) and target_id are required' });
        }
        const reviews = await listPublicReviews({
            target_type: targetType,
            target_id: q.target_id,
            limit: q.limit ? Number(q.limit) : 20,
            offset: q.offset ? Number(q.offset) : 0,
            min_rating: q.min_rating ? Number(q.min_rating) : undefined,
        });
        return { reviews };
    });

    fastify.get('/api/reviews/provider', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const q = request.query as {
            shop_id?: string;
            barber_id?: string;
            min_rating?: string;
            limit?: string;
            offset?: string;
        };
        const reviews = await listProviderReviews({
            shop_id: q.shop_id ?? null,
            barber_id: q.barber_id ?? null,
            min_rating: q.min_rating ? Number(q.min_rating) : undefined,
            limit: q.limit ? Number(q.limit) : 20,
            offset: q.offset ? Number(q.offset) : 0,
        });
        return { reviews };
    });

    fastify.get('/api/reviews/pending', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const pending = await listPendingReviewsForUser(user.id);
        return { pending, count: pending.length };
    });

    fastify.get('/api/reviews/request/:token', async (request, reply) => {
        const { token } = request.params as { token: string };
        try {
            return await getReviewRequestByToken(token);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Review link not found';
            return reply.status(404).send({ error: msg });
        }
    });

    fastify.get('/api/reviews/status/:bookingId', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const { bookingId } = request.params as { bookingId: string };
        try {
            return await getBookingReviewStatus(bookingId, user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load review status';
            const code = msg === 'Unauthorized' ? 403 : 400;
            return reply.status(code).send({ error: msg });
        }
    });

    fastify.post<{
        Body: {
            booking_id: string;
            target_type?: string;
            rating: number;
            content?: string;
        };
    }>('/api/reviews', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const body = request.body ?? {};
        const targetType = parseTargetType(body.target_type) ?? 'barber';
        try {
            return await submitReview({
                booking_id: body.booking_id,
                reviewer_id: user.id,
                target_type: targetType,
                rating: Number(body.rating),
                content: body.content,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to submit review';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{
        Body: {
            token: string;
            target_type?: string;
            rating: number;
            content?: string;
        };
    }>('/api/reviews/guest', async (request, reply) => {
        const body = request.body ?? {};
        const targetType = parseTargetType(body.target_type) ?? 'barber';
        try {
            return await submitReviewByToken({
                token: body.token,
                target_type: targetType,
                rating: Number(body.rating),
                content: body.content,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to submit review';
            return reply.status(400).send({ error: msg });
        }
    });
}

export async function reviewCronRoutes(fastify: FastifyInstance) {
    fastify.post('/api/cron/review-nudges', async (request, reply) => {
        const expected = process.env.CRON_SECRET?.trim();
        if (expected) {
            const header = request.headers['x-cron-secret'] || request.headers.authorization;
            const token =
                typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : header;
            if (token !== expected) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
        } else if (process.env.NODE_ENV === 'production') {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        return await processReviewNudges();
    });
}
