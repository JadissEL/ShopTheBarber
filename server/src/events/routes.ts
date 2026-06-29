import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    cancelEventRegistration,
    createAdminEvent,
    getEventsConfig,
    getProviderEvent,
    listAdminEvents,
    listEventRegistrationsAdmin,
    listMyEventRegistrations,
    listProviderEvents,
    markRegistrationAttended,
    registerForEvent,
    updateAdminEvent,
    type AuthUser,
} from './logic';

async function requireAuth(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireAdmin(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (user.role !== 'admin') {
        void reply.status(403).send({ error: 'Forbidden' });
        return null;
    }
    return user;
}

export async function eventsRoutes(fastify: FastifyInstance) {
    fastify.get('/api/events/config', async () => getEventsConfig());

    fastify.get('/api/events/provider', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await listProviderEvents(user.id, user.role);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load events';
            return reply.status(403).send({ error: msg });
        }
    });

    fastify.get('/api/events/provider/mine', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        return listMyEventRegistrations(user.id);
    });

    fastify.get<{ Params: { eventId: string } }>('/api/events/:eventId', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await getProviderEvent(request.params.eventId, user.id, user.role);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Event not found';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Params: { eventId: string } }>(
        '/api/events/:eventId/register',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await registerForEvent(request.params.eventId, user.id, user.role);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Registration failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { eventId: string } }>(
        '/api/events/:eventId/cancel',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await cancelEventRegistration(request.params.eventId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Cancel failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get('/api/events/admin/list', async (request, reply) => {
        const ok = await requireAdmin(request, reply);
        if (!ok) return;
        return listAdminEvents();
    });

    fastify.post<{ Body: Record<string, unknown> }>('/api/events/admin', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        try {
            const body = request.body ?? {};
            return await createAdminEvent(user.id, body as Parameters<typeof createAdminEvent>[1]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create event';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { eventId: string }; Body: Record<string, unknown> }>(
        '/api/events/admin/:eventId',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await updateAdminEvent(
                    request.params.eventId,
                    request.body
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update event';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { eventId: string } }>(
        '/api/events/admin/:eventId/registrations',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            return listEventRegistrationsAdmin(request.params.eventId);
        }
    );

    fastify.patch<{ Params: { registrationId: string } }>(
        '/api/events/admin/registrations/:registrationId/attended',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await markRegistrationAttended(request.params.registrationId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update registration';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
