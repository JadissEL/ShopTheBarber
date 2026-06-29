/**
 * Clerk-only authentication. Verifies the Bearer token with Clerk, then maps it to the
 * Neon `users` row (provisioning or linking by email) so FK scopes use the internal users.id.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '../db/prisma';
import { verifyClerkToken } from './clerk';

export type ResolvedRequestUser = { id: string; email?: string; role?: string };

async function ensureDbUserFromClerk(profile: {
    clerk_user_id: string;
    email: string;
    role: string;
    full_name?: string | null;
    avatar_url?: string | null;
}) {
    const existingByClerk = await prisma.users.findUnique({
        where: { clerk_user_id: profile.clerk_user_id },
    });
    if (existingByClerk) return existingByClerk;

    const existingByEmail = await prisma.users.findUnique({ where: { email: profile.email } });
    if (existingByEmail) {
        return prisma.users.update({
            where: { id: existingByEmail.id },
            data: {
                clerk_user_id: profile.clerk_user_id,
                avatar_url: existingByEmail.avatar_url || profile.avatar_url || undefined,
                full_name: existingByEmail.full_name || profile.full_name || undefined,
                updated_at: new Date().toISOString(),
            },
        });
    }

    const roleSafe = ['client', 'barber', 'admin', 'shop_owner'].includes(profile.role)
        ? profile.role
        : 'client';
    const avatar =
        profile.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.email.split('@')[0] || 'User')}&background=random`;

    return prisma.users.create({
        data: {
            clerk_user_id: profile.clerk_user_id,
            email: profile.email,
            full_name: profile.full_name || profile.email.split('@')[0] || 'User',
            role: roleSafe,
            avatar_url: avatar,
        },
    });
}

/** Resolve a Bearer token to a DB-backed user (Clerk only). Returns null if invalid. */
export async function resolveUserFromBearer(token: string): Promise<ResolvedRequestUser | null> {
    const clerkClaims = await verifyClerkToken(token);
    if (!clerkClaims?.id || !clerkClaims.email) return null;

    const resolved = await ensureDbUserFromClerk({
        clerk_user_id: clerkClaims.id,
        email: clerkClaims.email,
        role: clerkClaims.role || 'client',
        full_name: clerkClaims.full_name,
        avatar_url: clerkClaims.avatar_url,
    });
    if (!resolved) return null;

    return {
        id: resolved.id,
        email: resolved.email ?? undefined,
        role: resolved.role ?? 'client',
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
        void reply.code(401).send({ error: 'Unauthorized', hint: 'Invalid or missing auth token.' });
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
