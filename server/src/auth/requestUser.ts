/**
 * Unified auth: Bearer can be sovereign JWT OR Clerk session JWT.
 * Attaches `{ id, email, role }` from the **database** row so FK scopes match.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import * as schema from '../db/schema';
import { verifyClerkToken } from './clerk';

export type ResolvedRequestUser = { id: string; email?: string; role?: string };

export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        void reply.code(401).send({ error: 'Unauthorized' });
        return false;
    }
    const token = authHeader.slice(7);

    // 1) Sovereign JWT (Fastify JWT, includes internal users.id UUID)
    try {
        await request.jwtVerify();
        const payload = request.user as { id?: string };
        if (payload?.id) {
            const row = await db.query.users.findFirst({
                where: eq(schema.users.id, String(payload.id)),
            });
            if (row) {
                (request as any).user = {
                    id: row.id,
                    email: row.email ?? undefined,
                    role: row.role ?? 'client',
                } satisfies ResolvedRequestUser;
                return true;
            }
        }
    } catch {
        // fall through – try Clerk JWT
    }

    // 2) Clerk bearer – map to SQLite/Postgres user row (provision or link by email)
    const clerkClaims = await verifyClerkToken(token);
    if (!clerkClaims?.id || !clerkClaims.email) {
        void reply.code(401).send({ error: 'Unauthorized', hint: 'Invalid or missing auth token.' });
        return false;
    }

    const resolved = await ensureDbUserFromClerk({
        clerk_user_id: clerkClaims.id,
        email: clerkClaims.email,
        role: clerkClaims.role || 'client',
        full_name: clerkClaims.full_name,
        avatar_url: clerkClaims.avatar_url,
    });
    if (!resolved) {
        void reply.code(500).send({ error: 'Failed to resolve profile' });
        return false;
    }

    (request as any).user = {
        id: resolved.id,
        email: resolved.email ?? undefined,
        role: resolved.role ?? 'client',
    } satisfies ResolvedRequestUser;
    return true;
}

async function ensureDbUserFromClerk(profile: {
    clerk_user_id: string;
    email: string;
    role: string;
    full_name?: string | null;
    avatar_url?: string | null;
}): Promise<(typeof schema.users.$inferSelect) | null> {
    const existingByClerk = await db.query.users.findFirst({
        where: eq(schema.users.clerk_user_id, profile.clerk_user_id),
    });
    if (existingByClerk) return existingByClerk;

    const existingByEmail = await db.query.users.findFirst({
        where: eq(schema.users.email, profile.email),
    });
    if (existingByEmail?.id) {
        await db
            .update(schema.users)
            .set({
                clerk_user_id: profile.clerk_user_id,
                avatar_url: existingByEmail.avatar_url || profile.avatar_url || undefined,
                full_name: existingByEmail.full_name || profile.full_name || undefined,
                updated_at: new Date().toISOString(),
            })
            .where(eq(schema.users.id, existingByEmail.id));

        const [refreshed] = await db.select().from(schema.users).where(eq(schema.users.id, existingByEmail.id));
        return refreshed ?? existingByEmail;
    }

    const id = crypto.randomUUID();
    const avatar =
        profile.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.email.split('@')[0] || 'User')}&background=random`;

    const roleSafe = ['client', 'barber', 'admin', 'shop_owner'].includes(profile.role)
        ? profile.role
        : 'client';

    await db.insert(schema.users).values({
        id,
        clerk_user_id: profile.clerk_user_id,
        email: profile.email,
        password_hash: null,
        full_name: profile.full_name || profile.email.split('@')[0] || 'User',
        role: roleSafe as 'client' | 'barber' | 'admin' | 'shop_owner',
        avatar_url: avatar,
    });

    return (await db.query.users.findFirst({ where: eq(schema.users.id, id) })) ?? null;
}
