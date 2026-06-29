import type { FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    getPublicFeatureFlags,
    listAdminFeatureModules,
    setFeatureFlagEnabled,
} from './logic';

async function requireAdmin(
    request: Parameters<typeof authenticateRequest>[0],
    reply: Parameters<typeof authenticateRequest>[1]
) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    const user = request.user as { role?: string };
    if (user.role !== 'admin') {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return user;
}

export async function featureFlagRoutes(fastify: FastifyInstance) {
    fastify.get('/api/feature-flags', async (_request, reply) => {
        try {
            const flags = await getPublicFeatureFlags();
            return { flags };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load feature flags';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get('/api/admin/feature-flags', async (request, reply) => {
        const admin = await requireAdmin(request, reply);
        if (!admin) return;
        try {
            const modules = await listAdminFeatureModules();
            return { modules };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load admin feature flags';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { key: string }; Body: { enabled?: boolean } }>(
        '/api/admin/feature-flags/:key',
        async (request, reply) => {
            const admin = await requireAdmin(request, reply);
            if (!admin) return;
            const { key } = request.params;
            const enabled = request.body?.enabled;
            if (typeof enabled !== 'boolean') {
                return reply.status(400).send({ error: 'enabled must be a boolean' });
            }
            try {
                const row = await setFeatureFlagEnabled(key, enabled);
                const flags = await getPublicFeatureFlags();
                return { ok: true, key: row.key, enabled: row.enabled !== false, flags };
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update feature flag';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
