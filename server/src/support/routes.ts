import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    createSupportTicket,
    getAdminSupportStats,
    getSupportDeskInfo,
    getSupportUnreadSummary,
    getTicketMessages,
    listAdminSupportTickets,
    listMyTickets,
    sendSupportTicketMessage,
    updateSupportTicketStatus,
} from './logic';

async function requireAdmin(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return false;
    const user = request.user as { role?: string };
    if (user?.role !== 'admin') {
        void reply.status(403).send({ error: 'Forbidden' });
        return false;
    }
    return true;
}

export async function supportRoutes(fastify: FastifyInstance) {
    fastify.get('/api/support/desk', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        try {
            return await getSupportDeskInfo();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Support unavailable';
            return reply.status(503).send({ error: msg });
        }
    });

    fastify.get('/api/support/unread', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return getSupportUnreadSummary(user.id);
    });

    fastify.get('/api/support/tickets', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return listMyTickets(user.id);
    });

    fastify.post<{
        Body: {
            subject?: string;
            category?: string;
            content?: string;
            order_id?: string;
            booking_id?: string;
        };
    }>('/api/support/tickets', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { subject, category, content, order_id, booking_id } = request.body ?? {};
        if (!subject?.trim() || !content?.trim()) {
            return reply.status(400).send({ error: 'subject and content are required' });
        }
        try {
            return await createSupportTicket({
                user_id: user.id,
                subject: subject.trim(),
                category,
                content: content.trim(),
                context: { order_id, booking_id },
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create ticket';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get<{ Params: { ticketId: string } }>(
        '/api/support/tickets/:ticketId/messages',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            try {
                return await getTicketMessages(request.params.ticketId, user.id, user.role);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load messages';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { ticketId: string }; Body: { content?: string } }>(
        '/api/support/tickets/:ticketId/messages',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            const content = request.body?.content;
            if (!content?.trim()) return reply.status(400).send({ error: 'content is required' });
            try {
                return await sendSupportTicketMessage({
                    ticket_id: request.params.ticketId,
                    sender_id: user.id,
                    sender_role: user.role,
                    content: content.trim(),
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to send message';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.patch<{ Params: { ticketId: string }; Body: { status?: string } }>(
        '/api/support/tickets/:ticketId',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            const status = request.body?.status;
            if (!status) return reply.status(400).send({ error: 'status is required' });
            try {
                return await updateSupportTicketStatus({
                    ticket_id: request.params.ticketId,
                    user_id: user.id,
                    role: user.role,
                    status: status as 'open' | 'in_progress' | 'resolved' | 'closed',
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update ticket';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Querystring: { status?: string; assigned_to?: string } }>(
        '/api/support/admin/tickets',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            return listAdminSupportTickets({
                status: request.query.status,
                assigned_to: request.query.assigned_to,
            });
        }
    );

    fastify.get('/api/support/admin/stats', async (request, reply) => {
        const ok = await requireAdmin(request, reply);
        if (!ok) return;
        return getAdminSupportStats();
    });
}
