import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { resolveUserFromBearer, authenticateRequest } from '../auth/requestUser';
import { subscribeUser } from './events';
import {
    getBookingChatContext,
    getMessageThreads,
    getThreadMessages,
    proposeReschedule,
    resolveContactUserId,
    respondToReschedule,
    sendMessage,
} from './logic';

async function authenticateStream(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    const authHeader = request.headers.authorization;
    const queryToken = (request.query as { token?: string })?.token;
    const token =
        authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken?.trim();
    if (!token) {
        void reply.code(401).send({ error: 'Unauthorized' });
        return false;
    }
    const user = await resolveUserFromBearer(token);
    if (!user) {
        void reply.code(401).send({ error: 'Unauthorized' });
        return false;
    }
    (request as FastifyRequest & { user: typeof user }).user = user;
    return true;
}

export async function messageRoutes(fastify: FastifyInstance) {
    fastify.get('/api/messages/threads', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return getMessageThreads(user.id);
    });

    fastify.get<{ Querystring: { contact_user_id: string; booking_id?: string } }>(
        '/api/messages/thread',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            const contactId = request.query.contact_user_id;
            if (!contactId) return reply.status(400).send({ error: 'contact_user_id is required' });
            try {
                return await getThreadMessages(user.id, contactId, request.query.booking_id ?? null);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load messages';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{
        Body: {
            receiver_id?: string;
            content?: string;
            booking_id?: string;
            message_type?: string;
            metadata?: Record<string, unknown>;
        };
    }>('/api/messages/send', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { receiver_id, content, booking_id, message_type, metadata } = request.body ?? {};
        if (!receiver_id || !content?.trim()) {
            return reply.status(400).send({ error: 'receiver_id and content are required' });
        }
        try {
            return await sendMessage({
                sender_id: user.id,
                receiver_id,
                content: content.trim(),
                booking_id: booking_id ?? null,
                message_type,
                metadata: metadata ?? null,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to send message';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get<{ Querystring: { user_id?: string; barber_id?: string; shop_id?: string } }>(
        '/api/messages/resolve-contact',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            try {
                return await resolveContactUserId(request.query);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Contact not found';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { bookingId: string } }>(
        '/api/messages/booking/:bookingId/context',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await getBookingChatContext(request.params.bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Booking not found';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{
        Body: { booking_id?: string; proposed_start_time?: string; note?: string };
    }>('/api/messages/reschedule/propose', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { booking_id, proposed_start_time, note } = request.body ?? {};
        if (!booking_id || !proposed_start_time) {
            return reply.status(400).send({ error: 'booking_id and proposed_start_time are required' });
        }
        try {
            return await proposeReschedule({
                booking_id,
                proposer_id: user.id,
                proposed_start_time,
                note,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to propose reschedule';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Params: { messageId: string }; Body: { accept?: boolean } }>(
        '/api/messages/reschedule/:messageId/respond',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await respondToReschedule({
                    message_id: request.params.messageId,
                    user_id: user.id,
                    accept: request.body?.accept === true,
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to respond to proposal';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get('/api/messages/stream', async (request, reply) => {
        const ok = await authenticateStream(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        const heartbeat = setInterval(() => {
            reply.raw.write(': ping\n\n');
        }, 25000);

        const unsubscribe = subscribeUser(user.id, (event) => {
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        request.raw.on('close', () => {
            clearInterval(heartbeat);
            unsubscribe();
        });
    });

    /** Legacy alias */
    fastify.get<{ Params: { userId: string } }>(
        '/api/conversations/:userId',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const { userId } = request.params;
            const currentUser = request.user as { id: string };
            if (currentUser.id !== userId) return reply.status(403).send({ error: 'Forbidden' });
            const threads = await getMessageThreads(userId);
            return threads.map((t) => ({
                id: t.contact_user_id,
                full_name: t.full_name,
                role: t.role,
                avatar_url: t.avatar_url,
            }));
        }
    );
}
