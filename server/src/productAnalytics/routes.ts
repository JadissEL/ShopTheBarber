import type { FastifyInstance } from 'fastify';
import { authenticateRequest, resolveOptionalUserId } from '../auth/requestUser';
import { isIpRateLimitAllowed } from '../lib/ipRateLimit';
import { trackProductEvent, trackProductEventsBatch, identifyProductUser } from './track';
import { getProductAnalyticsDashboard } from './metrics';
import { DEFAULT_ANALYTICS_DAYS } from './config';
import { getNorthStarDashboard } from '../admin/northStarMetrics';

type TrackBody = {
    event_name?: string;
    eventName?: string;
    session_id?: string;
    properties?: Record<string, unknown>;
    page_path?: string;
};

function normalizeTrackBody(body: TrackBody) {
    const event_name = (body.event_name || body.eventName || '').trim();
    if (!event_name) throw new Error('event_name required');
    return {
        event_name,
        session_id: body.session_id ?? null,
        properties: body.properties ?? null,
        page_path: body.page_path ?? null,
    };
}

export async function productAnalyticsRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: TrackBody }>('/api/analytics/track', async (request, reply) => {
        const ip = request.ip || 'unknown';
        if (!(await isIpRateLimitAllowed('analytics:track', ip, 120, 60_000))) {
            return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
        }
        try {
            const userId = await resolveOptionalUserId(request);
            const body = normalizeTrackBody(request.body ?? {});
            const row = await trackProductEvent({
                ...body,
                user_id: userId,
            });
            return reply.send({ ok: true, id: row.id });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Track failed';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Body: { events?: TrackBody[] } }>(
        '/api/analytics/track/batch',
        async (request, reply) => {
            const ip = request.ip || 'unknown';
            if (!(await isIpRateLimitAllowed('analytics:batch', ip, 40, 60_000))) {
                return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
            }
            try {
                const userId = await resolveOptionalUserId(request);
                const raw = request.body?.events ?? [];
                if (!Array.isArray(raw) || raw.length === 0) {
                    return reply.status(400).send({ error: 'events array required' });
                }
                const events = raw.map((e) => {
                    const n = normalizeTrackBody(e);
                    return { ...n, user_id: userId };
                });
                const result = await trackProductEventsBatch(events);
                return reply.send({ ok: true, ...result });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Batch track failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Body: { anonymous_id?: string; session_id?: string } }>(
        '/api/analytics/identify',
        async (request, reply) => {
            const ip = request.ip || 'unknown';
            if (!(await isIpRateLimitAllowed('analytics:identify', ip, 30, 60_000))) {
                return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
            }
            try {
                const userId = await resolveOptionalUserId(request);
                if (!userId) {
                    return reply.status(401).send({ error: 'Authentication required' });
                }
                const body = request.body ?? {};
                const result = await identifyProductUser({
                    user_id: userId,
                    anonymous_id: body.anonymous_id ?? null,
                    session_id: body.session_id ?? null,
                });
                return reply.send({ ok: true, ...result });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Identify failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Querystring: { days?: string } }>(
        '/api/admin/analytics/dashboard',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            if (request.user?.role !== 'admin') {
                return reply.status(403).send({ error: 'Admin access required' });
            }
            const daysRaw = request.query.days;
            const days = daysRaw
                ? Math.min(365, Math.max(1, parseInt(daysRaw, 10) || DEFAULT_ANALYTICS_DAYS))
                : DEFAULT_ANALYTICS_DAYS;
            const dashboard = await getProductAnalyticsDashboard({ days });
            return reply.send(dashboard);
        }
    );

    fastify.get<{ Querystring: { days?: string } }>(
        '/api/admin/analytics/north-star',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            if (request.user?.role !== 'admin') {
                return reply.status(403).send({ error: 'Admin access required' });
            }
            const daysRaw = request.query.days;
            const days = daysRaw
                ? Math.min(365, Math.max(1, parseInt(daysRaw, 10) || 30))
                : 30;
            return reply.send(await getNorthStarDashboard(days));
        }
    );
}
