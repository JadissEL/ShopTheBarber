import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    getAuthorProfileForUser,
    getCompanyProfileForUser,
    getSellerProfileForUser,
    updateAuthorProfileForUser,
    updateCompanyProfileForUser,
    updateSellerProfileForUser,
} from './logic';

function denyUnlessRole(
    role: string | undefined,
    allowed: string[],
    reply: { status: (code: number) => { send: (body: unknown) => unknown } },
): boolean {
    if (!role || !allowed.includes(role)) {
        reply.status(403).send({ error: 'Insufficient permissions for this profile' });
        return true;
    }
    return false;
}

export async function onboardingRoutes(fastify: FastifyInstance) {
    fastify.get('/api/onboarding/seller-profile', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (denyUnlessRole(user.role, ['seller', 'admin'], reply)) return;
        const profile = await getSellerProfileForUser(user.id);
        return profile ?? null;
    });

    fastify.put<{ Body: { display_name?: string } }>(
        '/api/onboarding/seller-profile',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            if (denyUnlessRole(user.role, ['seller', 'admin'], reply)) return;
            try {
                return await updateSellerProfileForUser(user.id, request.body ?? {});
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to save seller profile';
                return reply.status(400).send({ error: msg });
            }
        },
    );

    fastify.get('/api/onboarding/company-profile', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (denyUnlessRole(user.role, ['company', 'admin'], reply)) return;
        const profile = await getCompanyProfileForUser(user.id);
        return profile ?? null;
    });

    fastify.put<{
        Body: {
            name?: string;
            description?: string;
            website?: string;
            logo_url?: string;
            location?: string;
        };
    }>('/api/onboarding/company-profile', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (denyUnlessRole(user.role, ['company', 'admin'], reply)) return;
        try {
            return await updateCompanyProfileForUser(user.id, request.body ?? {});
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to save company profile';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/onboarding/author-profile', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (denyUnlessRole(user.role, ['blogger', 'admin'], reply)) return;
        const profile = await getAuthorProfileForUser(user.id);
        return profile ?? null;
    });

    fastify.put<{ Body: { pen_name?: string; bio?: string } }>(
        '/api/onboarding/author-profile',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            if (denyUnlessRole(user.role, ['blogger', 'admin'], reply)) return;
            try {
                return await updateAuthorProfileForUser(user.id, request.body ?? {});
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to save author profile';
                return reply.status(400).send({ error: msg });
            }
        },
    );
}
