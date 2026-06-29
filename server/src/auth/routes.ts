/**
 * Auth routes (Clerk-only). Interactive sign-in/up is handled by Clerk on the frontend;
 * the backend only resolves the current Clerk-backed user. No password/JWT login here.
 */
import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from './requestUser';

export async function authRoutes(fastify: FastifyInstance) {
    // ME (Profile), resolves the Clerk-backed user
    fastify.get('/api/auth/me', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;

        const { id } = request.user as { id: string };
        const user = await prisma.users.findUnique({ where: { id } });
        if (!user) {
            return reply.status(401).send({ error: 'User not found' });
        }
        return {
            ...user,
            phone: user.phone,
            sms_reminders_enabled: user.sms_reminders_enabled !== false,
            email_reminders_enabled: user.email_reminders_enabled !== false,
        };
    });

    // LOGOUT, client clears the Clerk session; server is stateless
    fastify.post('/api/auth/logout', async () => {
        return { success: true };
    });
}
