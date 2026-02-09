import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import {
    isGoogleCalendarConfigured,
    getGoogleAuthorizeUrl,
    exchangeCodeForTokens,
} from '../logic/calendar';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-shopthebarber';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function integrationRoutes(fastify: FastifyInstance) {
    // Return Google OAuth URL (frontend fetches with JWT, then redirects user to this URL)
    fastify.get('/api/integrations/google/authorize', {
        preHandler: [async (req: FastifyRequest, reply: FastifyReply) => {
            try {
                await req.jwtVerify();
            } catch {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
        }],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        if (!isGoogleCalendarConfigured()) {
            return reply.status(503).send({
                error: 'Google Calendar integration is not configured',
                hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server environment.',
            });
        }
        const user = request.user as { id: string };
        const state = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '600' }); // 10 min
        const url = getGoogleAuthorizeUrl(state);
        return reply.send({ url });
    });

    // OAuth callback: exchange code for tokens, store refresh_token for user, redirect to frontend
    fastify.get('/api/integrations/google/callback', async (request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, reply: FastifyReply) => {
        const { code, state, error } = request.query;
        const redirectTo = `${FRONTEND_URL}/AccountSettings?google_calendar=`;
        if (error) {
            return reply.redirect(302, redirectTo + 'error&message=' + encodeURIComponent(error));
        }
        if (!code || !state) {
            return reply.redirect(302, redirectTo + 'error&message=missing_code_or_state');
        }
        let userId: string;
        try {
            const decoded = jwt.verify(state, JWT_SECRET) as { userId: string };
            userId = decoded.userId;
        } catch {
            return reply.redirect(302, redirectTo + 'error&message=invalid_state');
        }
        try {
            const { refresh_token } = await exchangeCodeForTokens(code);
            await db.update(schema.users)
                .set({
                    google_calendar_refresh_token: refresh_token,
                    updated_at: new Date().toISOString(),
                })
                .where(eq(schema.users.id, userId));
            return reply.redirect(302, redirectTo + 'connected');
        } catch (e: any) {
            fastify.log.warn({ err: e }, 'Google Calendar token exchange failed');
            return reply.redirect(302, redirectTo + 'error&message=' + encodeURIComponent(e?.message || 'token_exchange_failed'));
        }
    });

    // Status: is Google Calendar connected for the current user?
    fastify.get('/api/integrations/google/status', {
        preHandler: [async (req: FastifyRequest, reply: FastifyReply) => {
            try {
                await req.jwtVerify();
            } catch {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
        }],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as { id: string };
        const [row] = await db.select({ google_calendar_refresh_token: schema.users.google_calendar_refresh_token })
            .from(schema.users)
            .where(eq(schema.users.id, user.id));
        return { connected: Boolean(row?.google_calendar_refresh_token), configured: isGoogleCalendarConfigured() };
    });

    // Disconnect: clear stored refresh token
    fastify.post('/api/integrations/google/disconnect', {
        preHandler: [async (req: FastifyRequest, reply: FastifyReply) => {
            try {
                await req.jwtVerify();
            } catch {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
        }],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as { id: string };
        await db.update(schema.users)
            .set({
                google_calendar_refresh_token: null,
                updated_at: new Date().toISOString(),
            })
            .where(eq(schema.users.id, user.id));
        return { success: true };
    });
}
