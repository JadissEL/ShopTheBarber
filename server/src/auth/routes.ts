import { FastifyInstance } from 'fastify';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from './password';
import { z } from 'zod';
import { sendEmail } from '../logic/email';

// VALIDATION SCHEMAS
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(2),
    role: z.enum(['client', 'barber', 'shop_owner']).optional(),
    phone: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

function sanitizeUser(u: Record<string, unknown> | null) {
    if (!u) return u;
    const { password_hash: _, ...rest } = u;
    return rest;
}

export async function authRoutes(fastify: FastifyInstance) {

    // REGISTER
    fastify.post('/api/auth/register', async (request, reply) => {
        fastify.log.info({ hasBody: !!request.body, bodyKeys: request.body && typeof request.body === 'object' ? Object.keys(request.body as object) : [] }, 'REGISTER request');
        try {
            const body = request.body as unknown;
            if (!body || typeof body !== 'object') {
                return reply.status(400).send({ error: 'Request body must be JSON with email, password, and full_name' });
            }
            const data = registerSchema.parse(body);

            const existing = await db.query.users.findFirst({
                where: eq(schema.users.email, data.email)
            });
            if (existing) {
                return reply.status(409).send({ error: 'Email already registered' });
            }

            let hashedPassword: string;
            try {
                hashedPassword = await hashPassword(data.password);
            } catch (hashErr: any) {
                fastify.log.error(hashErr, 'Register: hash password failed');
                return reply.status(500).send({ error: 'Password hash failed: ' + (hashErr?.message || 'unknown') });
            }
            const userId = crypto.randomUUID();

            try {
                await db.insert(schema.users).values({
                    id: userId,
                    email: data.email,
                    password_hash: hashedPassword,
                    full_name: data.full_name,
                    role: (data.role as string) || 'client',
                    phone: data.phone ?? null,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=random`
                });
            } catch (insertErr: any) {
                fastify.log.error(insertErr, 'Register: insert failed');
                return reply.status(500).send({
                    error: 'Insert failed: ' + (insertErr?.message || 'unknown'),
                    hint: "Run 'npm run push' in the server folder if this is a database error."
                });
            }

            let user: typeof schema.users.$inferSelect | undefined;
            try {
                const rows = await db.select().from(schema.users).where(eq(schema.users.id, userId));
                user = rows[0];
            } catch (selectErr: any) {
                fastify.log.error(selectErr, 'Register: select after insert failed');
                return reply.status(500).send({
                    error: 'Select failed: ' + (selectErr?.message || 'unknown'),
                    hint: "Run 'npm run push' or node scripts/add-users-stripe-columns.mjs in the server folder."
                });
            }

            if (!user) {
                fastify.log.error('Register: user inserted but not found by id');
                return reply.status(500).send({ error: 'Registration failed. Please try again.' });
            }

            const payload = { id: userId, email: String(user.email ?? ''), role: user.role ?? 'client' };
            let token: string;
            try {
                token = fastify.jwt.sign(payload);
            } catch (jwtErr: any) {
                fastify.log.error(jwtErr, 'Register: jwt.sign failed');
                return reply.status(500).send({ error: 'Token failed: ' + (jwtErr?.message || 'unknown') });
            }

            sendEmail({
                to: user.email,
                subject: 'Welcome to Shop The Barber!',
                template: 'welcome',
                data: { full_name: user.full_name }
            }).catch(err => fastify.log.warn(err, 'Welcome email failed'));

            return { user: sanitizeUser(user as Record<string, unknown>), token };
        } catch (e: any) {
            fastify.log.error({ message: e?.message, code: e?.code, stack: e?.stack }, 'REGISTER catch');
            if (e instanceof z.ZodError) {
                const first = e.errors[0];
                const message = first
                    ? `${first.path.join('.')}: ${first.message}`
                    : 'Validation failed';
                return reply.status(400).send({ error: message, details: e.errors });
            }
            if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE' || (e?.message && /UNIQUE|unique/.test(e.message))) {
                return reply.status(409).send({ error: 'Email already registered' });
            }
            const msg = (e?.message || '').toLowerCase();
            const schemaError = msg.includes('no such table') || msg.includes('sqlite') || String(e?.code ?? '').toLowerCase().startsWith('sqlite');
            if (schemaError) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({
                error: e?.message || 'Registration failed. Please try again.',
                hint: "If you see a database error above, run 'npm run push' in the server folder."
            });
        }
    });

    // LOGIN
    fastify.post('/api/auth/login', async (request, reply) => {
        fastify.log.info({ hasBody: !!request.body, bodyKeys: request.body && typeof request.body === 'object' ? Object.keys(request.body as object) : [] }, 'LOGIN request');
        try {
            const body = request.body as unknown;
            if (!body || typeof body !== 'object') {
                return reply.status(400).send({ error: 'Request body must be JSON with email and password' });
            }
            const { email, password } = loginSchema.parse(body);

            const user = await db.query.users.findFirst({
                where: eq(schema.users.email, email)
            });

            if (!user) {
                return reply.status(401).send({ error: 'Invalid email or password' });
            }

            if (!user.password_hash || typeof user.password_hash !== 'string') {
                return reply.status(401).send({ error: 'Please login via social provider or reset password' });
            }

            let isValid = false;
            try {
                isValid = await comparePassword(password, user.password_hash);
            } catch (compareErr: any) {
                fastify.log.warn({ err: compareErr }, 'Password compare failed (e.g. invalid hash format)');
                return reply.status(401).send({ error: 'Invalid email or password' });
            }
            if (!isValid) {
                return reply.status(401).send({ error: 'Invalid email or password' });
            }

            const payload = {
                id: String(user.id),
                email: String(user.email ?? ''),
                role: user.role ?? 'client'
            };
            let token: string;
            try {
                token = fastify.jwt.sign(payload);
            } catch (jwtErr: any) {
                fastify.log.error({ err: jwtErr, message: jwtErr?.message, stack: jwtErr?.stack }, 'LOGIN jwt.sign failed');
                return reply.status(500).send({
                    error: 'Token failed: ' + (jwtErr?.message || 'unknown'),
                    hint: 'Check JWT_SECRET is set in server .env'
                });
            }
            return { user: sanitizeUser(user as Record<string, unknown>), token };
        } catch (e: any) {
            fastify.log.error({ message: e?.message, code: e?.code, stack: e?.stack }, 'LOGIN catch');
            if (e instanceof z.ZodError) {
                return reply.status(400).send({ error: e.errors[0]?.message || 'Invalid input' });
            }
            const msg = (e?.message || '').toLowerCase();
            const schemaError = msg.includes('no such table') || msg.includes('sqlite') || String(e?.code ?? '').toLowerCase().startsWith('sqlite');
            if (schemaError) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({
                error: e?.message || 'Login failed',
                hint: "Check server terminal for full stack trace. Run 'npm run push' and 'npm run seed' in the server folder if this is a database error."
            });
        }
    });

    // ME (Profile)
    fastify.get('/api/auth/me', async (request, reply) => {
        try {
            await request.jwtVerify();
            const payload = request.user as { id: string };

            const user = await db.query.users.findFirst({
                where: eq(schema.users.id, payload.id)
            });

            if (!user) {
                return reply.status(401).send({ error: 'User not found' });
            }

            return sanitizeUser(user as Record<string, unknown>);
        } catch (err) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // LOGOUT
    fastify.post('/api/auth/logout', async (request, reply) => {
        // Client-side token removal is sufficient for JWT, but we return success
        return { success: true };
    });
}
