/**
 * Clerk-only authentication. Verifies Bearer token and maps to Neon users row.
 * New users are NOT auto-created — they must call POST /api/auth/provision first.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../db/prisma';
import { verifyClerkToken } from './clerk';
import { resolveAndSyncUserRole } from './resolveUserRole';
import { findUserByClerkProfile } from './provisionUser';

export type ResolvedRequestUser = {
    id: string;
    email?: string;
    role?: string;
    account_type?: string | null;
};

export type ClerkProfilePayload = {
    clerk_user_id: string;
    email: string;
    role: string;
    account_type?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
};

/** Resolve Clerk JWT claims without requiring a DB user (for provision flow). */
export async function resolveClerkProfileFromBearer(
    token: string,
): Promise<ClerkProfilePayload | null> {
    const clerkClaims = await verifyClerkToken(token);
    if (!clerkClaims?.id || !clerkClaims.email) return null;

    return {
        clerk_user_id: clerkClaims.id,
        email: clerkClaims.email,
        role: clerkClaims.role || 'client',
        account_type: clerkClaims.account_type ?? null,
        full_name: clerkClaims.full_name,
        avatar_url: clerkClaims.avatar_url,
    };
}

async function linkClerkToExistingUser(
    existing: { id: string; clerk_user_id: string | null },
    profile: ClerkProfilePayload,
) {
    if (existing.clerk_user_id === profile.clerk_user_id) return existing;

    return prisma.users.update({
        where: { id: existing.id },
        data: {
            clerk_user_id: profile.clerk_user_id,
            avatar_url: profile.avatar_url || undefined,
            full_name: profile.full_name || undefined,
            updated_at: new Date().toISOString(),
        },
    });
}

/** Resolve Bearer token to DB user. Returns null if valid Clerk session but not provisioned. */
export async function resolveUserFromBearer(token: string): Promise<ResolvedRequestUser | null> {
    const profile = await resolveClerkProfileFromBearer(token);
    if (!profile) return null;

    let resolved = await findUserByClerkProfile(profile);
    if (!resolved) return null;

    if (!resolved.clerk_user_id) {
        resolved = await linkClerkToExistingUser(resolved, profile);
    }

    const syncedRole = await resolveAndSyncUserRole(resolved.id, resolved.role ?? 'client');

    return {
        id: resolved.id,
        email: resolved.email ?? undefined,
        role: syncedRole,
        account_type: resolved.account_type,
    };
}

function clerkSecretMissing(): boolean {
    return !process.env.CLERK_SECRET_KEY?.trim();
}

/** Strict auth guard for protected routes. Sends 401 and returns false when unauthenticated. */
export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        void reply.code(401).send({ error: 'Unauthorized' });
        return false;
    }
    if (clerkSecretMissing()) {
        void reply.code(503).send({
            error: 'Authentication service unavailable',
            hint: 'Set CLERK_SECRET_KEY in server/.env (same Clerk app as VITE_CLERK_PUBLISHABLE_KEY).',
        });
        return false;
    }
    const user = await resolveUserFromBearer(authHeader.slice(7));
    if (!user) {
        void reply.code(401).send({
            error: 'Account not provisioned',
            code: 'NEEDS_PROVISION',
            hint: 'Complete account setup by choosing your account type.',
        });
        return false;
    }
    (request as any).user = user;
    return true;
}

/** Optional auth: returns the resolved user id, or null when no/invalid token (no error sent). */
export async function resolveOptionalUserId(request: FastifyRequest): Promise<string | null> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const user = await resolveUserFromBearer(authHeader.slice(7));
    return user?.id ?? null;
}
