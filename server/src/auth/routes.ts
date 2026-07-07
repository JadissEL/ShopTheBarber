/**
 * Auth routes (Clerk-only). Interactive sign-in/up is handled by Clerk on the frontend;
 * new users must provision via POST /api/auth/provision after choosing account type.
 */
import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import {
    authenticateRequest,
    resolveClerkProfileFromBearer,
    resolveUserFromBearer,
} from './requestUser';
import { resolveAndSyncUserRole } from './resolveUserRole';
import { isAccountType, ACCOUNT_TYPES, dashboardPathForAccountType } from './accountType';
import { createSignupIntent, findUserByClerkProfile, provisionUser } from './provisionUser';
import { resolveCompanyCommerceEnabled } from './companyCommerce';

export async function authRoutes(fastify: FastifyInstance) {
    /** Public — create short-lived signup intent after account type selection */
    fastify.post<{ Body: { accountType?: string } }>('/api/auth/signup-intent', async (request, reply) => {
        const accountType = request.body?.accountType;
        if (!isAccountType(accountType)) {
            return reply.status(400).send({
                error: 'Invalid account type',
                validTypes: ACCOUNT_TYPES,
            });
        }

        const intent = await createSignupIntent(accountType);
        return {
            token: intent.token,
            accountType: intent.accountType,
            expiresAt: intent.expiresAt,
        };
    });

    /** Authenticated Clerk session — provision platform user with immutable account type */
    fastify.post<{
        Body: { accountType?: string; signupIntentToken?: string };
    }>('/api/auth/provision', async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const profile = await resolveClerkProfileFromBearer(authHeader.slice(7));
        if (!profile) {
            return reply.status(401).send({ error: 'Invalid session' });
        }

        const accountType = request.body?.accountType;
        if (!isAccountType(accountType)) {
            return reply.status(400).send({
                error: 'accountType is required',
                validTypes: ACCOUNT_TYPES,
            });
        }

        const result = await provisionUser({
            profile,
            accountType,
            signupIntentToken: request.body?.signupIntentToken ?? null,
        });

        if (!result.ok) {
            const status = result.code === 'ACCOUNT_TYPE_CONFLICT' ? 409 : 400;
            return reply.status(status).send({
                error: result.message,
                code: result.code,
            });
        }

        const role = await resolveAndSyncUserRole(result.user!.id, result.user!.role);
        return {
            ...result.user,
            role,
            account_type: result.user!.account_type,
            needsProvision: false,
            dashboardPath: dashboardPathForAccountType(result.user!.account_type),
        };
    });

    /** ME — returns needsProvision when Clerk session exists but no DB user */
    fastify.get('/api/auth/me', async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const token = authHeader.slice(7);
        const profile = await resolveClerkProfileFromBearer(token);
        if (!profile) {
            return reply.status(401).send({ error: 'Unauthorized', hint: 'Invalid or missing auth token.' });
        }

        const existing = await findUserByClerkProfile(profile);
        if (!existing) {
            return reply.status(200).send({
                needsProvision: true,
                email: profile.email,
                full_name: profile.full_name,
            });
        }

        if (!existing.clerk_user_id) {
            await prisma.users.update({
                where: { id: existing.id },
                data: {
                    clerk_user_id: profile.clerk_user_id,
                    updated_at: new Date().toISOString(),
                },
            });
        }

        const user = await prisma.users.findUnique({ where: { id: existing.id } });
        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }

        const role = await resolveAndSyncUserRole(user.id, user.role);
        const company_commerce_enabled = await resolveCompanyCommerceEnabled({
            id: user.id,
            account_type: user.account_type,
        });
        return {
            ...user,
            role,
            account_type: user.account_type,
            needsProvision: false,
            phone: user.phone,
            sms_reminders_enabled: user.sms_reminders_enabled !== false,
            email_reminders_enabled: user.email_reminders_enabled !== false,
            company_commerce_enabled,
        };
    });

    fastify.post('/api/auth/logout', async () => {
        return { success: true };
    });
}
