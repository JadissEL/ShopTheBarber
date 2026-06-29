import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    cancelLanguageProgramWaitlist,
    createAdminLanguageProgram,
    createWaitlistCheckout,
    getLanguageProgramsConfig,
    getProviderLanguageProgram,
    listAdminLanguagePrograms,
    listAdminProgramWaitlist,
    listMyLanguageProgramWaitlist,
    listProviderLanguagePrograms,
    promoteWaitlistToEnrolled,
    updateAdminLanguageProgram,
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

export async function languageProgramsRoutes(fastify: FastifyInstance) {
    fastify.get('/api/language-programs/config', async () => getLanguageProgramsConfig());

    fastify.get('/api/language-programs/provider', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await listProviderLanguagePrograms(user.id, user.role);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load programs';
            return reply.status(403).send({ error: msg });
        }
    });

    fastify.get('/api/language-programs/provider/mine', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        return listMyLanguageProgramWaitlist(user.id);
    });

    fastify.get<{ Params: { programId: string } }>(
        '/api/language-programs/:programId',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await getProviderLanguageProgram(request.params.programId, user.id, user.role);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Program not found';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { programId: string }; Body: { terms_accepted?: boolean } }>(
        '/api/language-programs/:programId/join',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                const termsAccepted = request.body?.terms_accepted === true;
                return await createWaitlistCheckout(
                    user.id,
                    user.role,
                    request.params.programId,
                    termsAccepted
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to join waitlist';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { programId: string } }>(
        '/api/language-programs/:programId/cancel',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await cancelLanguageProgramWaitlist(user.id, request.params.programId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to cancel';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get('/api/language-programs/admin/list', async (request, reply) => {
        const ok = await requireAdmin(request, reply);
        if (!ok) return;
        return listAdminLanguagePrograms();
    });

    fastify.post<{ Body: Record<string, unknown> }>('/api/language-programs/admin', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        try {
            return await createAdminLanguageProgram(user.id, request.body ?? {});
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create program';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { programId: string }; Body: Record<string, unknown> }>(
        '/api/language-programs/admin/:programId',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await updateAdminLanguageProgram(request.params.programId, request.body ?? {});
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update program';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { programId: string } }>(
        '/api/language-programs/admin/:programId/waitlist',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await listAdminProgramWaitlist(request.params.programId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load waitlist';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.patch<{ Params: { waitlistId: string } }>(
        '/api/language-programs/admin/waitlist/:waitlistId/enroll',
        async (request, reply) => {
            const ok = await requireAdmin(request, reply);
            if (!ok) return;
            try {
                return await promoteWaitlistToEnrolled(request.params.waitlistId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to enroll';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
