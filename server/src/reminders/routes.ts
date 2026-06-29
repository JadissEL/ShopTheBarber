import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { processAllBookingReminders } from './logic';
import { getClientHabitForUser, processRebookNudges } from './rebookNudges';
import { handleTwilioInboundSms } from './twilioWebhook';
import { buildTwilioWebhookUrl, validateTwilioWebhookSignature } from './twilioSignature';
import {
    buildBookingConfirmationSms,
    isTwilioConfigured,
    normalizePhoneE164,
    sendSms,
} from '../logic/sms';

function verifyCronSecret(request: { headers: Record<string, string | string[] | undefined> }): boolean {
    const expected = process.env.CRON_SECRET?.trim();
    if (!expected) return process.env.NODE_ENV !== 'production';
    const header = request.headers['x-cron-secret'] || request.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
        return header.slice(7) === expected;
    }
    return header === expected;
}

const preferencesSchema = z.object({
    sms_reminders_enabled: z.boolean().optional(),
    email_reminders_enabled: z.boolean().optional(),
    sms_rebook_nudges_enabled: z.boolean().optional(),
    phone: z.string().max(32).optional().nullable(),
});

export async function reminderRoutes(fastify: FastifyInstance) {
    /** Cron / GitHub Actions, send due SMS + email reminders */
    fastify.post('/api/cron/booking-reminders', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        const result = await processAllBookingReminders();
        return result;
    });

    /** Cron, habit-based SMS nudges when a client is usually due for another visit */
    fastify.post('/api/cron/rebook-nudges', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        return await processRebookNudges();
    });

    fastify.get('/api/reminders/habit', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const userId = (request.user as { id: string }).id;
        try {
            return await getClientHabitForUser(userId);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
                return reply.status(503).send({
                    error: 'Habit insights unavailable, database migration pending',
                });
            }
            throw err;
        }
    });

    /** Twilio inbound SMS webhook (configure in Twilio console Messaging webhook URL) */
    fastify.post('/api/webhooks/twilio/sms', async (request, reply) => {
        const body = request.body as Record<string, string | undefined>;
        const signature = request.headers['x-twilio-signature'] as string | undefined;
        const webhookUrl = buildTwilioWebhookUrl(request);
        const valid = validateTwilioWebhookSignature({
            authToken: process.env.TWILIO_AUTH_TOKEN,
            signature,
            url: webhookUrl,
            body,
        });
        if (!valid) {
            return reply.status(403).send({ error: 'Invalid Twilio signature' });
        }
        await handleTwilioInboundSms(body.From, body.Body);
        reply.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    });

    fastify.get('/api/reminders/status', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const userId = (request.user as { id: string }).id;
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { phone: true, sms_reminders_enabled: true, email_reminders_enabled: true, sms_rebook_nudges_enabled: true },
        });
        const phoneNormalized = normalizePhoneE164(user?.phone);
        return {
            twilio_configured: isTwilioConfigured(),
            sms_enabled_globally: process.env.SMS_REMINDERS_ENABLED !== 'false',
            hours_before: parseFloat(process.env.SMS_REMINDER_HOURS_BEFORE || '24') || 24,
            phone: user?.phone ?? null,
            phone_valid: !!phoneNormalized,
            phone_e164: phoneNormalized,
            sms_reminders_enabled: user?.sms_reminders_enabled !== false,
            email_reminders_enabled: user?.email_reminders_enabled !== false,
            sms_rebook_nudges_enabled: user?.sms_rebook_nudges_enabled !== false,
            webhook_url_hint: '/api/webhooks/twilio/sms',
        };
    });

    fastify.post('/api/reminders/test-sms', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const userId = (request.user as { id: string }).id;
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { phone: true, full_name: true },
        });
        if (!user?.phone?.trim()) {
            return reply.status(400).send({ error: 'Add a mobile number in Notification Settings first.' });
        }
        const result = await sendSms(
            user.phone,
            buildBookingConfirmationSms({
                barberName: 'ShopTheBarber',
                dateText: 'Test',
                timeText: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                serviceName: 'SMS test message',
            })
        );
        if (!result.success) {
            return reply.status(502).send({ error: result.error || 'Failed to send test SMS' });
        }
        return {
            success: true,
            mocked: result.mocked ?? false,
            sid: result.sid ?? null,
            message: result.mocked
                ? 'Twilio is not configured, message logged only (dev mode).'
                : 'Test SMS sent. Check your phone.',
        };
    });

    fastify.get('/api/reminders/preferences', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const userId = (request.user as { id: string }).id;
        try {
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: {
                    phone: true,
                    sms_reminders_enabled: true,
                    email_reminders_enabled: true,
                    sms_rebook_nudges_enabled: true,
                },
            });
            if (!user) return reply.status(404).send({ error: 'User not found' });
            const phoneE164 = normalizePhoneE164(user.phone);
            return {
                phone: user.phone,
                phone_e164: phoneE164,
                phone_valid: !!phoneE164,
                sms_reminders_enabled: user.sms_reminders_enabled !== false,
                email_reminders_enabled: user.email_reminders_enabled !== false,
                sms_rebook_nudges_enabled: user.sms_rebook_nudges_enabled !== false,
                twilio_configured: isTwilioConfigured(),
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
                return reply.status(503).send({
                    error: 'Reminder preferences unavailable, database migration pending',
                    hint: 'Run prisma migrate deploy on the API host.',
                });
            }
            throw err;
        }
    });

    fastify.patch('/api/reminders/preferences', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const parsed = preferencesSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const userId = (request.user as { id: string }).id;

        if (parsed.data.phone !== undefined && parsed.data.phone?.trim()) {
            const normalized = normalizePhoneE164(parsed.data.phone);
            if (!normalized) {
                return reply.status(400).send({
                    error: 'Invalid phone number. Use international format, e.g. +15551234567',
                });
            }
        }

        const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (parsed.data.sms_reminders_enabled !== undefined) {
            data.sms_reminders_enabled = parsed.data.sms_reminders_enabled;
        }
        if (parsed.data.email_reminders_enabled !== undefined) {
            data.email_reminders_enabled = parsed.data.email_reminders_enabled;
        }
        if (parsed.data.sms_rebook_nudges_enabled !== undefined) {
            data.sms_rebook_nudges_enabled = parsed.data.sms_rebook_nudges_enabled;
        }
        if (parsed.data.phone !== undefined) {
            const raw = parsed.data.phone?.trim();
            data.phone = raw ? normalizePhoneE164(raw) || raw : null;
        }

        try {
            const updated = await prisma.users.update({
                where: { id: userId },
                data,
                select: {
                    phone: true,
                    sms_reminders_enabled: true,
                    email_reminders_enabled: true,
                    sms_rebook_nudges_enabled: true,
                },
            });
            const phoneE164 = normalizePhoneE164(updated.phone);
            return {
                phone: updated.phone,
                phone_e164: phoneE164,
                phone_valid: !!phoneE164,
                sms_reminders_enabled: updated.sms_reminders_enabled !== false,
                email_reminders_enabled: updated.email_reminders_enabled !== false,
                sms_rebook_nudges_enabled: updated.sms_rebook_nudges_enabled !== false,
                twilio_configured: isTwilioConfigured(),
            };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
                return reply.status(503).send({
                    error: 'Reminder preferences unavailable, database migration pending',
                });
            }
            throw err;
        }
    });
}
