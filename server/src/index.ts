import './loadEnv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { db } from './db';
import * as schema from './db/schema';
import { eq, and, sql } from 'drizzle-orm';

import { validateBooking, createBookingLogic } from './logic/booking';
import { handleStripeWebhook } from './webhooks/stripe';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { validatePromoCode } from './logic/promoCode';
import { notifyUserOfModerationAction } from './logic/moderation';
import { verifyBackupIntegrity } from './admin/backup';
import { sendEmail } from './logic/email';
import { askLocalAI } from './logic/ai';
import { getEntityScopeCondition, rowInScope } from './entityScope';

dotenv.config();

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: process.env.FRONTEND_URL || true,
    credentials: true
});
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret-shopthebarber'
});

// --- HELPER FUNCTIONS ---
function parseTimeString(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/** Entities that require JWT for all access (list/get/create/update/delete). Prevents unauthenticated access to user-specific data. */
const AUTH_REQUIRED_ENTITIES = new Set([
    'booking', 'loyalty_profile', 'loyalty_transaction', 'message', 'notification', 'payout', 'favorite', 'dispute', 'audit_log', 'waiting_list_entry'
]);

async function requireAuthPreHandler(request: any, reply: any) {
    try {
        await request.jwtVerify();
    } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
}

/** Requires valid JWT and role === 'admin'. Use for admin-only routes. */
async function requireAdminPreHandler(request: any, reply: any) {
    try {
        await request.jwtVerify();
    } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    const user = request.user as { id: string; role?: string };
    if (user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
}

/** If error looks like missing table/schema, return 503 with hint. */
function isDbSchemaError(e: any): boolean {
    const msg = (e?.message || '').toLowerCase();
    return msg.includes('no such table') || msg.includes('sqlite_error') || e?.code === 'SQLITE_ERROR';
}

// --- ROUTES ---

// Health check (no auth) — confirms DB is reachable
fastify.get('/api/health', async (_request, reply) => {
    try {
        await db.select({ id: schema.users.id }).from(schema.users).limit(1);
        return { ok: true, db: 'ok' };
    } catch (e: any) {
        fastify.log.error(e);
        return reply.status(503).send({
            ok: false,
            error: 'Database unavailable',
            hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
        });
    }
});

// 0. Auth Routes (Mock for MVP)
import { authRoutes } from './auth/routes';

// 0. Auth Routes (Real JWT Implementation)
fastify.register(authRoutes);

// 0.1 Payment Routes (Stripe Integration)
import { paymentRoutes } from './payments/routes';
fastify.register(paymentRoutes);

// 0.2 Cart Routes (Marketplace)
import { cartRoutes } from './cart/routes';
fastify.register(cartRoutes);

// 0.3 Order Routes (tracking, my orders)
import { orderRoutes } from './orders/routes';
fastify.register(orderRoutes);

// 0.4 Vault (grooming vault summary)
import { vaultRoutes } from './vault/routes';
fastify.register(vaultRoutes);

// 0.5 Jobs (employment ecosystem)
import { jobsRoutes } from './jobs/routes';
fastify.register(jobsRoutes);

// 0.6 Applicants (profiles, applications, saved jobs, interviews)
import { applicantsRoutes } from './applicants/routes';
fastify.register(applicantsRoutes);

// 1. Validate Booking Availability (Migrated from functions/validateBookingAvailability.ts)
fastify.post('/api/functions/validate-availability', async (request, reply) => {
    const params = request.body as any;

    // Parse start_datetime to Date object if it's a string
    const validationParams = {
        ...params,
        start_datetime: new Date(params.start_datetime)
    };

    const result = await validateBooking(validationParams);

    if (result.status !== 'AVAILABLE') {
        return result;
    }

    return {
        status: 'AVAILABLE',
        message: 'Slot is available',
        validated_at: new Date().toISOString()
    };
});

// 1.1 AI Style Advisor
fastify.post('/api/functions/ai-advisor', async (request, reply) => {
    const { prompt, context } = request.body as { prompt: string, context?: string };
    if (!prompt) return reply.status(400).send({ error: 'Prompt is required' });

    const response = await askLocalAI(prompt, context);
    return { response };
});

// 2. Calculate Taxes (Migrated from functions/calculateTaxes.ts)
fastify.post('/api/functions/calculate-taxes', async (request, reply) => {
    const { amount, country_code = 'GR', entity_type = 'service_provider', tax_year } = request.body as any;

    if (!amount || amount <= 0) {
        return reply.status(400).send({ error: 'Valid amount required' });
    }

    function calculateGreeceTaxes(amount: number, entity_type: string) {
        const breakdown: any = {};

        // VAT (24% standard rate in Greece)
        const vatRate = 0.24;
        const vatAmount = amount * vatRate;
        breakdown.vat = {
            name: 'VAT (Φ.Π.Α)',
            rate: vatRate,
            amount: Math.round(vatAmount * 100) / 100,
            description: 'Value Added Tax'
        };

        // Withholding tax (15% for service providers)
        if (entity_type === 'service_provider') {
            const withholdingRate = 0.15;
            const withholdingAmount = amount * withholdingRate;
            breakdown.withholding_tax = {
                name: 'Withholding Tax (Κ.Π.Δ)',
                rate: withholdingRate,
                amount: Math.round(withholdingAmount * 100) / 100,
                description: 'Tax withheld at source for freelancers'
            };
        }

        // Social security (20% for self-employed)
        if (entity_type === 'self_employed') {
            const socialSecurityRate = 0.20;
            const socialSecurityAmount = amount * socialSecurityRate;
            breakdown.social_security = {
                name: 'Social Security (ΙΚΑ-ΕΤΑΜ)',
                rate: socialSecurityRate,
                amount: Math.round(socialSecurityAmount * 100) / 100,
                description: 'Social security contributions'
            };
        }

        // Professional tax
        if (entity_type === 'barber' || entity_type === 'shop') {
            const professionalRate = 0.02;
            const professionalAmount = amount * professionalRate;
            breakdown.professional_fee = {
                name: 'Professional Fee',
                rate: professionalRate,
                amount: Math.round(professionalAmount * 100) / 100,
                description: 'Chamber of commerce or professional association fee'
            };
        }

        return breakdown;
    }

    const taxBreakdown = country_code === 'GR' ? calculateGreeceTaxes(amount, entity_type) : {};
    const totalTaxes = Object.values(taxBreakdown).reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0);

    return {
        success: true,
        gross_amount: amount,
        tax_breakdown: taxBreakdown,
        total_taxes: totalTaxes,
        net_amount: amount - totalTaxes,
        country_code,
        tax_year: tax_year || new Date().getFullYear(),
        calculated_at: new Date().toISOString()
    };
});

// 3. Calculate Commission and Fees (auth + booking scope: only client or barber/shop for that booking)
fastify.post('/api/functions/calculate-fees', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { action, context, booking_id, cancellation_type } = request.body as any;
    const currentUser = request.user as { id: string };

    const ensureBookingScope = async (bid: string) => {
        const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, bid));
        if (!booking || !(await rowInScope('booking', schema.bookings, booking as Record<string, unknown>, currentUser)))
            return reply.status(403).send({ error: 'Forbidden' });
    };

    const bid = (context?.booking_id ?? booking_id) as string | undefined;
    if (bid && (action === 'calculateFees' || action === 'calculateRefund' || action === 'verifyLocked')) {
        await ensureBookingScope(bid);
        if (reply.sent) return;
    }

    if (action === 'calculateFees') {
        const {
            booking_id,
            base_price,
            tax_amount = 0,
            discount_amount = 0,
            barber_id,
            shop_id,
            context_type
        } = context;

        if (!booking_id || base_price === undefined || !barber_id || !context_type) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }

        const effectiveFeeRate = context_type === 'shop' ? 0.20 : 0.15;
        const final_price = base_price - discount_amount;
        const platform_fee = Math.round(final_price * effectiveFeeRate * 100) / 100;
        const subtotal_after_platform_fee = final_price - platform_fee;
        const provider_payout = Math.max(0, subtotal_after_platform_fee - tax_amount);

        const financial_breakdown = {
            base_price: Math.round(base_price * 100) / 100,
            discount_amount: Math.round(discount_amount * 100) / 100,
            final_price: Math.round(final_price * 100) / 100,
            platform_fee: Math.round(platform_fee * 100) / 100,
            commission_rate_snapshot: effectiveFeeRate,
            tax_amount: Math.round(tax_amount * 100) / 100,
            provider_payout: Math.round(provider_payout * 100) / 100,
            currency: 'USD',
            calculated_at: new Date().toISOString(),
            calculated_by: 'sovereign-backend'
        };

        // Check if booking already has fees calculated
        const existing = await db.query.bookings.findFirst({
            where: eq(schema.bookings.id, booking_id)
        });

        if (existing?.financial_breakdown && existing.status === 'confirmed') {
            return {
                status: 'ALREADY_CALCULATED',
                financial_breakdown: JSON.parse(existing.financial_breakdown as string),
                message: 'Fees already locked for this booking'
            };
        }

        // Update booking
        await db.update(schema.bookings)
            .set({
                financial_breakdown: JSON.stringify(financial_breakdown),
                price_at_booking: final_price
            })
            .where(eq(schema.bookings.id, booking_id));

        // Audit Log
        await db.insert(schema.audit_logs).values({
            action: 'COMMISSION_CALCULATED',
            resource_type: 'Booking',
            resource_id: booking_id,
            actor_id: 'system',
            changes: JSON.stringify({ financial_breakdown, locked: true }),
            details: JSON.stringify({ barber_id, shop_id, context_type, fee_rate: effectiveFeeRate })
        });

        return {
            status: 'CALCULATED',
            booking_id,
            financial_breakdown,
            provider_payout,
            platform_revenue: platform_fee,
            locked: true
        };
    }

    if (action === 'calculateRefund') {
        const booking = await db.query.bookings.findFirst({
            where: eq(schema.bookings.id, booking_id)
        });

        if (!booking?.financial_breakdown) {
            return reply.status(400).send({ error: 'Cannot refund: no financial breakdown found' });
        }

        const financial_breakdown = JSON.parse(booking.financial_breakdown as string);
        const bookingDate = new Date(booking.start_time);
        const now = new Date();
        const hoursBefore = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refund_percentage;
        if (hoursBefore > 24) {
            refund_percentage = 1.0;
        } else if (hoursBefore > 2) {
            refund_percentage = 0.5;
        } else {
            refund_percentage = 0.0;
        }

        const refund_amount = Math.round(financial_breakdown.final_price * refund_percentage * 100) / 100;
        const platform_fee_refund = Math.round(financial_breakdown.platform_fee * refund_percentage * 100) / 100;

        return {
            refund_amount,
            platform_fee_refund,
            refund_percentage,
            hours_before_appointment: Math.round(hoursBefore),
            locked_breakdown: financial_breakdown
        };
    }

    if (action === 'verifyLocked') {
        const booking = await db.query.bookings.findFirst({
            where: eq(schema.bookings.id, booking_id)
        });

        if (!booking?.financial_breakdown) {
            return reply.status(400).send({ error: `Booking ${booking_id} has no financial breakdown locked` });
        }

        return {
            locked: true,
            breakdown: JSON.parse(booking.financial_breakdown as string),
            cannot_modify: true
        };
    }

    return reply.status(400).send({ error: 'Invalid action' });
});

// 4. Send Booking Email (auth required)
fastify.post('/api/functions/send-booking-email', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { action, booking, cancelledBy } = request.body as any;

    // In our simplified logic, the frontend passes the 'booking' object.
    // In a real production system, we'd fetch the latest data from DB here.

    try {
        if (action === 'confirmation' || action === 'create') {
            await sendEmail({
                to: booking.client_email || 'client@example.com', // Fallback or fetch from DB
                subject: `Booking Confirmed - ${booking.service_name}`,
                template: 'confirmation',
                data: {
                    clientName: booking.client_name,
                    barberName: booking.barber_name,
                    date: booking.date_text,
                    time: booking.time_text,
                    serviceName: booking.service_name,
                    location: booking.location,
                    price: `${booking.price_at_booking} EUR`
                }
            });
        }
        else if (action === 'cancellation' || action === 'cancel') {
            await sendEmail({
                to: booking.client_email || 'client@example.com',
                subject: `Booking Cancelled - ${booking.service_name}`,
                template: 'cancellation',
                data: {
                    clientName: booking.client_name,
                    serviceName: booking.service_name,
                    date: booking.date_text,
                    time: booking.time_text,
                    cancelledBy: cancelledBy || 'user',
                    refundAmount: booking.refund_amount ? `${booking.refund_amount} EUR` : null
                }
            });
        }

        return { success: true, message: 'Email sent successfully' };
    } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Failed to send email' });
    }
});

// 5. Check Stripe Connect Status (auth + self only)
fastify.post('/api/functions/checkStripeConnectStatus', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { userId } = request.body as any;
    const uid = userId ?? currentUser.id;
    if (uid !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, uid)
    });

    return {
        data: {
            isConnected: user?.stripe_connect_status === 'active',
            status: user?.stripe_connect_status || 'unconnected',
            accountId: user?.stripe_account_id || null
        }
    };
});


// 6. Initiate Stripe Connect (auth + self only)
fastify.post('/api/functions/initiateStripeConnect', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { userId } = request.body as any;
    const uid = userId ?? currentUser.id;
    if (uid !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });

    // In production, you would:
    // 1. Create a Stripe Express account if user doesn't have one
    // 2. Create an Account Link (onboarding URL)
    // 3. Update DB with account ID and status='pending'

    // For now, we simulate the flow and update the DB status
    const accountId = `acct_mock_${Math.random().toString(36).substring(7)}`;

    await db.update(schema.users)
        .set({
            stripe_account_id: accountId,
            stripe_connect_status: 'pending'
        })
        .where(eq(schema.users.id, uid));

    return {
        data: {
            url: `https://connect.stripe.com/express/onboarding/mock?account=${accountId}`,
            accountId
        }
    };
});

// 7. Stripe Webhook Handler (Migrated)
fastify.post('/api/webhooks/stripe', async (request, reply) => {
    try {
        const signature = request.headers['stripe-signature'] as string;
        const rawBody = JSON.stringify(request.body);
        const result = await handleStripeWebhook(rawBody, signature);
        return result;
    } catch (e: any) {
        return reply.status(400).send({ error: e.message });
    }
});

// 8. Promo Code Validation (Migrated)
fastify.post('/api/functions/validate-promo-code', async (request, reply) => {
    try {
        const result = await validatePromoCode(request.body as any);
        return result;
    } catch (e: any) {
        return reply.status(400).send({ error: e.message });
    }
});

// 9. Moderation Notification (Migrated - Admin Only)
fastify.post('/api/admin/moderation/notify', { preHandler: [requireAdminPreHandler] }, async (request, reply) => {
    try {
        const result = await notifyUserOfModerationAction(request.body as any);
        return result;
    } catch (e: any) {
        return reply.status(400).send({ error: e.message });
    }
});

// 10. Backup Integrity Verification (Migrated - Admin Only)
fastify.post('/api/admin/backup/verify', { preHandler: [requireAdminPreHandler] }, async (request, reply) => {
    try {
        const { admin_user_id } = request.body as any;
        const result = await verifyBackupIntegrity(admin_user_id || 'system');
        return result;
    } catch (e: any) {
        return reply.status(500).send({ error: e.message });
    }
});


// 12. Provider Analytics (auth required: user may only request analytics for own shop/barber)
import { getProviderAnalytics } from './provider/analytics';
fastify.post('/api/functions/provider-analytics', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const { shopId, barberId } = request.body as { shopId?: string; barberId?: string };
        if (!shopId && !barberId) {
            return reply.status(400).send({ error: 'shopId or barberId required' });
        }
        const currentUser = request.user as { id: string };
        if (barberId) {
            const [barber] = await db.select({ user_id: schema.barbers.user_id }).from(schema.barbers).where(eq(schema.barbers.id, barberId));
            if (!barber || barber.user_id !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
        } else if (shopId) {
            const [shop] = await db.select({ owner_id: schema.shops.owner_id }).from(schema.shops).where(eq(schema.shops.id, shopId));
            if (!shop) return reply.status(403).send({ error: 'Forbidden' });
            const isOwner = shop.owner_id === currentUser.id;
            const members = await db.select({ user_id: schema.shop_members.user_id }).from(schema.shop_members).where(eq(schema.shop_members.shop_id, shopId));
            const isMember = members.some(m => m.user_id === currentUser.id);
            if (!isOwner && !isMember) return reply.status(403).send({ error: 'Forbidden' });
        }
        const result = await getProviderAnalytics(shopId!, barberId);
        return result;
    } catch (e: any) {
        return reply.status(500).send({ error: e.message });
    }
});

// 11. Platform Financial Analytics (Admin Only)
import { getPlatformFinancials } from './admin/analytics';
fastify.post('/api/functions/financial-analytics', { preHandler: [requireAdminPreHandler] }, async (request, reply) => {
    try {
        const result = await getPlatformFinancials();
        return result;
    } catch (e: any) {
        return reply.status(500).send({ error: e.message });
    }
});

// 13. Chat / Conversations (auth required: user may only load their own conversations)
fastify.get('/api/conversations/:userId', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { userId } = request.params as any;
    const currentUser = request.user as { id: string };
    if (currentUser?.id !== userId) return reply.status(403).send({ error: 'Forbidden' });

    // Find all distinct users that have exchanged messages with this user
    const received = await db.select({ contact_id: schema.messages.sender_id })
        .from(schema.messages)
        .where(eq(schema.messages.receiver_id, userId));

    const sent = await db.select({ contact_id: schema.messages.receiver_id })
        .from(schema.messages)
        .where(eq(schema.messages.sender_id, userId));

    const contactIds = Array.from(new Set([...received, ...sent].map(item => item.contact_id)));

    if (contactIds.length === 0) return [];

    const contacts = await db.select().from(schema.users).where(sql`${schema.users.id} IN (${sql.join(contactIds.map(id => sql`${id}`), sql`, `)})`);

    // Return contacts with latest message snippet (simplified for MVP)
    return contacts;
});

// Custom Booking Creation (auth required: client_id forced to current user)
fastify.post('/api/bookings', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        await rateLimitMiddleware(request, reply);
        if (reply.sent) return;

        const currentUser = request.user as { id: string };
        const body = request.body as any;
        if (body.client_id && body.client_id !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
        const booking = await createBookingLogic({ ...body, client_id: currentUser.id });
        return booking;
    } catch (e: any) {
        const message = (e && e.message) || 'Booking failed';
        fastify.log.warn({ err: e, message }, 'POST /api/bookings error');
        return reply.status(400).send({ error: message });
    }
});

// 14. Reviews (auth required: reviewer_id must be current user)
import { submitReview } from './logic/review';
fastify.post('/api/reviews', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const currentUser = request.user as { id: string };
        const body = request.body as any;
        if (body.reviewer_id && body.reviewer_id !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
        const result = await submitReview({ ...body, reviewer_id: currentUser.id });
        return result;
    } catch (e: any) {
        return reply.status(400).send({ error: e.message });
    }
});

// Generic entity routes
const entities = ['barber', 'shop', 'service', 'booking', 'loyalty_profile', 'loyalty_transaction', 'message', 'notification', 'dispute', 'audit_log', 'shop_member', 'pricing_rule', 'waiting_list_entry', 'staff_service_config', 'review', 'payout', 'shift', 'time_block', 'favorite', 'product', 'brand', 'brand_accolade', 'brand_collection'];

entities.forEach(entity => {
    const plural = `${entity}s`.replace(/ys$/, 'ies');
    const tableKey = entity.replace(/_(.)/g, (_, c) => c.toUpperCase()).replace(/-(.)/g, (_, c) => c.toUpperCase()) + (entity.endsWith('y') ? 'ies' : 's');
    const requireAuth = AUTH_REQUIRED_ENTITIES.has(entity);
    const routeOpts = requireAuth ? { preHandler: [requireAuthPreHandler] } : {};

    // Manual mapping for special cases
    let table = (schema as any)[entity.replace(/_(.)/g, (_, c) => c.toUpperCase()) + 's'] || (schema as any)[entity + 's'];

    // Fix common naming mismatches (ensure barber/shop resolve correctly for Explore)
    if (entity === 'barber') table = schema.barbers;
    if (entity === 'shop') table = schema.shops;
    if (entity === 'shop_member') table = schema.shop_members;
    if (entity === 'loyalty_profile') table = schema.loyalty_profiles;
    if (entity === 'loyalty_transaction') table = schema.loyalty_transactions;
    if (entity === 'audit_log') table = schema.audit_logs;
    if (entity === 'time_block') table = schema.time_blocks;
    if (entity === 'staff_service_config') table = schema.staff_service_configs;
    if (entity === 'waiting_list_entry') table = schema.waiting_list_entries;
    if (entity === 'pricing_rule') table = schema.pricing_rules;
    if (entity === 'promo_code') table = schema.promo_codes;
    if (entity === 'booking_service') table = schema.booking_services;
    if (entity === 'product') table = schema.products;
    if (entity === 'brand') table = schema.brands;
    if (entity === 'brand_accolade') table = schema.brand_accolades;
    if (entity === 'brand_collection') table = schema.brand_collections;

    if (!table) {
        console.warn(`Could not find table for entity: ${entity}`);
        return;
    }

    // LIST
    fastify.get(`/api/${plural}`, routeOpts, async (request, reply) => {
        try {
            if (!table) throw new Error(`Table not found for entity: ${entity}`);
            let query = db.select().from(table);
            if (requireAuth) {
                const user = request.user as { id: string; role?: string };
                const scopeCond = await getEntityScopeCondition(entity, table, user);
                if (scopeCond) query = query.where(scopeCond) as any;
            }
            const rows = await query;
            return Array.isArray(rows) ? rows : [];
        } catch (e: any) {
            fastify.log.error(`Error listing ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET BY ID
    fastify.get(`/api/${plural}/:id`, routeOpts, async (request, reply) => {
        try {
            const { id } = request.params as any;
            if (!table) throw new Error(`Table not found for entity: ${entity}`);
            const result = await db.select().from(table).where(eq(table.id, id));
            if (result.length === 0) return reply.status(404).send({ error: 'Not found' });
            const row = result[0] as Record<string, unknown>;
            if (requireAuth && !(await rowInScope(entity, table, row, request.user as any))) return reply.status(404).send({ error: 'Not found' });
            return result[0];
        } catch (e: any) {
            fastify.log.error(`Error getting ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // FILTER (Advanced Query)
    fastify.post(`/api/${plural}/filter`, routeOpts, async (request) => {
        const { query = {}, order, limit = 100, offset = 0 } = request.body as any;

        let dbQuery = db.select().from(table);
        const conditions: any[] = [];

        if (requireAuth) {
            const scopeCond = await getEntityScopeCondition(entity, table, request.user as any);
            if (scopeCond) conditions.push(scopeCond);
        }

        // Build conditions from query object
        Object.entries(query).forEach(([field, value]) => {
            if (table[field]) {
                if (typeof value === 'object' && value !== null) {
                    // Handle operators like $in, $gt, etc.
                    Object.entries(value).forEach(([op, val]) => {
                        // Very basic implementation of operators for SQLite/Drizzle
                        if (op === '$in' && Array.isArray(val)) {
                            conditions.push(sql`${table[field]} IN (${sql.join(val.map((v: any) => sql`${v}`), sql`, `)})`);
                        }
                    });
                } else {
                    conditions.push(eq(table[field], value));
                }
            }
        });

        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions)) as any;
        }

        // Handle ordering (simple implementation)
        if (order && typeof order === 'string') {
            const isDesc = order.startsWith('-');
            const field = isDesc ? order.substring(1) : order;
            if (table[field]) {
                dbQuery = dbQuery.orderBy(isDesc ? sql`${table[field]} DESC` : sql`${table[field]} ASC`) as any;
            }
        }

        return await dbQuery.limit(limit).offset(offset);
    });

    // CREATE (Custom logic for bookings and reviews, otherwise generic)
    if (entity !== 'booking' && entity !== 'review') {
        fastify.post(`/api/${plural}`, routeOpts, async (request) => {
            const data = request.body as any;
            return await db.insert(table).values(data).returning().get();
        });
    }

    // UPDATE
    fastify.patch(`/api/${plural}/:id`, routeOpts, async (request, reply) => {
        const { id } = request.params as any;
        const data = request.body as any;
        if (requireAuth) {
            const [existing] = await db.select().from(table).where(eq(table.id, id));
            if (!existing || !(await rowInScope(entity, table, existing as Record<string, unknown>, request.user as any)))
                return reply.status(404).send({ error: 'Not found' });
        }
        return await db.update(table).set(data).where(eq(table.id, id)).returning().get();
    });

    // DELETE
    fastify.delete(`/api/${plural}/:id`, routeOpts, async (request, reply) => {
        const { id } = request.params as any;
        if (requireAuth) {
            const [existing] = await db.select().from(table).where(eq(table.id, id));
            if (!existing || !(await rowInScope(entity, table, existing as Record<string, unknown>, request.user as any)))
                return reply.status(404).send({ error: 'Not found' });
        }
        return await db.delete(table).where(eq(table.id, id)).returning().get();
    });
});

// Global error handler: ensure 500 responses are always JSON (never text/plain stack traces)
fastify.setErrorHandler((err: any, request, reply) => {
    fastify.log.error({ err, message: err?.message, code: err?.code, stack: err?.stack, url: request?.url }, 'UNHANDLED_ERROR');
    const status = err.statusCode ?? 500;
    const body = {
        error: err.message || 'Internal Server Error',
        hint: status === 500 ? "Check server logs. Run 'npm run push' and 'npm run seed' in the server folder if this is a database error." : undefined
    };
    return reply.status(status).type('application/json').send(body);
});

// START SERVER
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3001;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Sovereign Backend running on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
