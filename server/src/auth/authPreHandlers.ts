import type { FastifyReply, FastifyRequest } from 'fastify';
import { createEntityScopeCache } from '../entityScope';
import { authenticateRequest } from './requestUser';
import {
    canAccessBookingProviderTools,
    isAdminRole,
    isProviderRole,
    accountTypeAllows,
} from './platformRbac';
import type { AccountType } from './accountType';

export type AuthedRequest = FastifyRequest & {
    user?: { id: string; email?: string; role?: string; account_type?: string | null };
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

/** Solo barber / shop only — booking calendar, payouts, provider settings. */
export async function requireBookingProviderPreHandler(request: AuthedRequest, reply: FastifyReply) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    request.entityScopeCache = createEntityScopeCache();
    const user = request.user;
    if (!canAccessBookingProviderTools(user?.role, user?.account_type)) {
        return reply.status(403).send({ error: 'Booking provider access required' });
    }
}

/** Restrict route to specific immutable account types. */
export function requireAccountTypes(...allowed: AccountType[]) {
    return async function requireAccountTypesPreHandler(request: AuthedRequest, reply: FastifyReply) {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        request.entityScopeCache = createEntityScopeCache();
        const user = request.user;
        if (!accountTypeAllows(user?.account_type, allowed)) {
            return reply.status(403).send({ error: 'Account type not permitted for this action' });
        }
    };
}
