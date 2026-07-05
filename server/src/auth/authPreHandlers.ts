import type { FastifyReply, FastifyRequest } from 'fastify';
import { createEntityScopeCache } from '../entityScope';
import { authenticateRequest } from './requestUser';
import { isAdminRole, isProviderRole } from './platformRbac';

export type AuthedRequest = FastifyRequest & {
    user?: { id: string; email?: string; role?: string };
    entityScopeCache?: ReturnType<typeof createEntityScopeCache>;
};

/** Authenticated request with per-request entity scope cache. */
export async function requireAuthPreHandler(request: AuthedRequest, reply: FastifyReply) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    request.entityScopeCache = createEntityScopeCache();
}

/** Platform admin only (not provider/client). */
export async function requireAdminPreHandler(request: AuthedRequest, reply: FastifyReply) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    request.entityScopeCache = createEntityScopeCache();
    const user = request.user;
    if (!isAdminRole(user?.role)) {
        return reply.status(403).send({ error: 'Forbidden' });
    }
}

/** Barber / shop owner / provider — excludes platform admin. */
export async function requireProviderPreHandler(request: AuthedRequest, reply: FastifyReply) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    request.entityScopeCache = createEntityScopeCache();
    const user = request.user;
    if (!isProviderRole(user?.role)) {
        return reply.status(403).send({ error: 'Provider access required' });
    }
}
