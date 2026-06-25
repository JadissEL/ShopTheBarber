import './loadEnv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { db } from './db';
import * as schema from './db/schema';
import { eq, and, or, sql, count, asc, desc, gt, lt, gte, lte, ne, inArray, notInArray, isNull, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

import { validateBooking, createBookingLogic } from './logic/booking';
import { handleStripeWebhook } from './webhooks/stripe';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { validatePromoCode } from './logic/promoCode';
import { notifyUserOfModerationAction } from './logic/moderation';
import { verifyBackupIntegrity } from './admin/backup';
import { sendEmail } from './logic/email';
import { askLocalAI } from './logic/ai';
import { createEntityScopeCache, getEntityScopeCondition, getManagedShopIdsForUser, rowInScope } from './entityScope';
import { authenticateRequest } from './auth/requestUser';

dotenv.config();

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: process.env.FRONTEND_URL || true,
    credentials: true
});
/** Required in production: signs legacy /api/auth tokens and configures @fastify/jwt fallback when Bearer is not a Clerk JWT. Clerk auth still needs CLERK_SECRET_KEY. See server/.env.example. */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
    console.error(
        'FATAL: JWT_SECRET is not set. Refusing to start in production. Set a strong JWT_SECRET even when using Clerk-only browser auth (Fastify JWT + legacy routes). See server/.env.example.'
    );
    process.exit(1);
}
fastify.register(jwt, {
    secret: jwtSecret || 'dev-only-insecure-secret-do-not-use-in-production',
    sign: { expiresIn: '7d' }
});

/** Entities that require JWT for all access (list/get/create/update/delete). */
const AUTH_REQUIRED_ENTITIES = new Set([
    'booking',
    'loyalty_profile',
    'loyalty_transaction',
    'message',
    'notification',
    'payout',
    'favorite',
    'dispute',
    'audit_log',
    'waiting_list_entry',
    'promo_code',
    'wishlist_item',
    'wallet_account',
    'wallet_transaction',
    'referral',
    'gift_card',
]);

/** Entities that allow public READ but require auth for write operations (create/update/delete). */
const AUTH_WRITE_ENTITIES = new Set([
    'barber', 'shop', 'service', 'shift', 'time_block', 'shop_member', 'pricing_rule', 'product', 'staff_service_config', 'review',
    'shop_inventory_item', 'shop_expense', 'barber_video', 'article', 'inspiration_post', 'legal_document', 'feature_flag',
]);

// Sovereign JWT first, then Clerk session JWT — both attach DB `users.id` for FK scope.
async function requireAuthPreHandler(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    /** One-barber-query + one-shop-query per authenticated request (deduped across entity routes). */
    request.entityScopeCache = createEntityScopeCache();
}

/** Requires DB role === 'admin' after unified auth resolution. */
async function requireAdminPreHandler(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
    request.entityScopeCache = createEntityScopeCache();
    const user = request.user as { id?: string; role?: string };
    if (user?.role !== 'admin') return reply.status(403).send({ error: 'Forbidden' });
}

/** SQLite better-sqlite3 cannot bind JS `true` for some pgTable boolean columns; Postgres accepts it. */
function promoCodesIsActiveClause() {
    return process.env.DATABASE_URL
        ? eq(schema.promo_codes.is_active, true)
        : sql`${schema.promo_codes.is_active} = 1`;
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

// 0. Auth Routes
import { authRoutes } from './auth/routes';

// 0. Auth Routes (Legacy - for backward compatibility during migration)
// Once all users are on Clerk, these can be removed
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

import { privacyRoutes } from './privacy/routes';
fastify.register(privacyRoutes);

// 1. Validate Booking Availability (rate-limited: 30 per minute per IP)
fastify.post('/api/functions/validate-availability', async (request, reply) => {
    const ip = request.ip || 'unknown';
    if (!checkIpRateLimit(`avail:${ip}`, 30, 60_000)) {
        return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
    }
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

// Simple in-memory rate limiter for public function endpoints
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkIpRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = ipRateLimits.get(ip);
    if (!entry || now > entry.resetAt) {
        ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
}

// 1.1 AI Style Advisor (rate-limited: 10 requests per minute per IP)
fastify.post('/api/functions/ai-advisor', async (request, reply) => {
    const ip = request.ip || 'unknown';
    if (!checkIpRateLimit(`ai:${ip}`, 10, 60_000)) {
        return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
    }
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
        if (!booking || !(await rowInScope('booking', schema.bookings, booking as Record<string, unknown>, currentUser, request.entityScopeCache)))
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

// 8. Promo Code Validation (rate-limited: 20 per minute per IP)
/**
 * Anonymous-friendly: active promo coverage for Explore / BarberProfile (no leaked auth-only list).
 * ?barber_id= — promos for that barber's shop + platform-wide.
 * Omit barber_id — { shop_ids, has_platform_promos } for filters.
 */
fastify.get('/api/public/active-promotions', async (request, reply) => {
    try {
        const barberId = (request.query as { barber_id?: string }).barber_id;

        if (barberId) {
            const barber = await db.query.barbers.findFirst({
                where: eq(schema.barbers.id, barberId),
                columns: { shop_id: true },
            });
            const shopId = barber?.shop_id ?? null;
            const scope = shopId
                ? or(eq(schema.promo_codes.shop_id, shopId), isNull(schema.promo_codes.shop_id))
                : isNull(schema.promo_codes.shop_id);
            const rows = await db
                .select()
                .from(schema.promo_codes)
                .where(and(promoCodesIsActiveClause(), scope!));
            return rows.map((r) => ({
                id: r.id,
                code: r.code,
                shop_id: r.shop_id,
                discount_type: r.discount_type,
                discount_value: r.discount_value,
                type: r.shop_id ? 'shop' : 'general',
                discount_text: r.discount_type === 'percentage' ? `${r.discount_value}% off` : `$${r.discount_value} off`,
                title: r.shop_id ? 'Shop offer' : 'Platform offer',
                description: 'Limited time offer',
            }));
        }

        const platform = await db
            .select({ id: schema.promo_codes.id })
            .from(schema.promo_codes)
            .where(and(promoCodesIsActiveClause(), isNull(schema.promo_codes.shop_id)));
        const shopRows = await db
            .selectDistinct({ shop_id: schema.promo_codes.shop_id })
            .from(schema.promo_codes)
            .where(and(promoCodesIsActiveClause(), isNotNull(schema.promo_codes.shop_id)));
        return {
            shop_ids: shopRows.map((r) => r.shop_id).filter(Boolean) as string[],
            has_platform_promos: platform.length > 0,
        };
    } catch (e: any) {
        fastify.log.error({ err: e }, 'GET /api/public/active-promotions');
        return reply.status(500).send({ error: e.message || 'Failed to load promotions' });
    }
});

fastify.post('/api/functions/validate-promo-code', async (request, reply) => {
    const ip = request.ip || 'unknown';
    if (!checkIpRateLimit(`promo:${ip}`, 20, 60_000)) {
        return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
    }
    try {
        const result = await validatePromoCode({ ...(request.body as any), skip_audit: true });
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
const entities = ['barber', 'shop', 'service', 'booking', 'loyalty_profile', 'loyalty_transaction', 'message', 'notification', 'dispute', 'audit_log', 'shop_member', 'pricing_rule', 'waiting_list_entry', 'staff_service_config', 'review', 'payout', 'shift', 'time_block', 'favorite', 'product', 'brand', 'brand_accolade', 'brand_collection', 'promo_code', 'inspiration_post', 'article', 'gift_card', 'referral', 'wallet_account', 'wallet_transaction', 'wishlist_item', 'barber_video', 'feature_flag', 'shop_inventory_item', 'shop_expense', 'legal_document'];

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
    if (entity === 'inspiration_post') table = schema.inspiration_posts;
    if (entity === 'article') table = schema.articles;
    if (entity === 'gift_card') table = schema.gift_cards;
    if (entity === 'referral') table = schema.referrals;
    if (entity === 'wallet_account') table = schema.wallet_accounts;
    if (entity === 'wallet_transaction') table = schema.wallet_transactions;
    if (entity === 'wishlist_item') table = schema.wishlist_items;
    if (entity === 'barber_video') table = schema.barber_videos;
    if (entity === 'feature_flag') table = schema.feature_flags;
    if (entity === 'shop_inventory_item') table = schema.shop_inventory_items;
    if (entity === 'shop_expense') table = schema.shop_expenses;
    if (entity === 'legal_document') table = schema.legal_documents;

    if (!table) {
        fastify.log.warn(`Could not find table for entity: ${entity}`);
        return;
    }

    // LIST (with optional server-side pagination via ?limit=&offset=)
    fastify.get(`/api/${plural}`, routeOpts, async (request, reply) => {
        try {
            if (!table) throw new Error(`Table not found for entity: ${entity}`);
            const qs = request.query as { limit?: string; offset?: string; order?: string };
            const limit = Math.min(Math.max(parseInt(qs.limit || '200', 10) || 200, 1), 1000);
            const offset = Math.max(parseInt(qs.offset || '0', 10) || 0, 0);

            let query = db.select().from(table);
            if (requireAuth) {
                const user = request.user as { id: string; role?: string };
                const scopeCond = await getEntityScopeCondition(entity, table, user, request.entityScopeCache);
                if (scopeCond) query = query.where(scopeCond) as any;
            }
            if (qs.order && typeof qs.order === 'string') {
                const isDesc = qs.order.startsWith('-');
                const field = isDesc ? qs.order.substring(1) : qs.order;
                const col = (table as Record<string, unknown>)[field];
                if (col) {
                    query = query.orderBy(isDesc ? desc(col as any) : asc(col as any)) as any;
                }
            }
            const rows = await (query as any).limit(limit).offset(offset);
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
            if (requireAuth && !(await rowInScope(entity, table, row, request.user as any, request.entityScopeCache)))
                return reply.status(404).send({ error: 'Not found' });
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
    fastify.post(`/api/${plural}/filter`, routeOpts, async (request, reply) => {
        const body = (request.body || {}) as {
            query?: Record<string, unknown>;
            order?: string;
            limit?: number;
            offset?: number;
        };
        const rowQuery = body.query && typeof body.query === 'object' ? body.query : {};
        const order = body.order;
        const limit = Math.min(Math.max(Number(body.limit ?? 200) || 200, 1), 1000);
        const offset = Math.max(Number(body.offset ?? 0) || 0, 0);

        let dbQuery = db.select().from(table);
        const conditions: any[] = [];

        if (requireAuth) {
            const scopeCond = await getEntityScopeCondition(entity, table, request.user as any, request.entityScopeCache);
            if (scopeCond) conditions.push(scopeCond);
        }

        const col = (f: string) => (table as Record<string, unknown>)[f] as any;

        Object.entries(rowQuery).forEach(([field, value]) => {
            const column = col(field);
            if (!column) return;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.entries(value as Record<string, unknown>).forEach(([op, val]) => {
                    if (op === '$in' && Array.isArray(val) && val.length > 0) {
                        conditions.push(inArray(column, val as any[]));
                    } else if (op === '$nin' && Array.isArray(val) && val.length > 0) {
                        conditions.push(notInArray(column, val as any[]));
                    } else if (op === '$gt') {
                        conditions.push(gt(column, val as any));
                    } else if (op === '$lt') {
                        conditions.push(lt(column, val as any));
                    } else if (op === '$gte') {
                        conditions.push(gte(column, val as any));
                    } else if (op === '$lte') {
                        conditions.push(lte(column, val as any));
                    } else if (op === '$ne') {
                        conditions.push(ne(column, val as any));
                    }
                });
            } else {
                conditions.push(eq(column, value));
            }
        });

        if (conditions.length > 0) {
            dbQuery = dbQuery.where(and(...conditions)) as any;
        }

        if (order && typeof order === 'string') {
            const isDesc = order.startsWith('-');
            const field = isDesc ? order.substring(1) : order;
            const orderCol = col(field);
            if (orderCol) {
                dbQuery = dbQuery.orderBy(isDesc ? desc(orderCol) : asc(orderCol)) as any;
            }
        }

        try {
            return await dbQuery.limit(limit).offset(offset);
        } catch (e: any) {
            fastify.log.error(`Error filtering ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // Validate body: strip unknown keys, reject non-object bodies
    const validateEntityBody = (body: unknown, reply: any): Record<string, unknown> | null => {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            reply.status(400).send({ error: 'Request body must be a JSON object' });
            return null;
        }
        const tableColumns = Object.keys(table);
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
            if (tableColumns.includes(key) && key !== 'id') {
                cleaned[key] = value;
            }
        }
        if (Object.keys(cleaned).length === 0) {
            reply.status(400).send({ error: 'No valid fields provided' });
            return null;
        }
        return cleaned;
    };

    // CREATE (Custom logic for bookings and reviews; promo codes enforce managed shop scope)
    if (entity !== 'booking' && entity !== 'review' && entity !== 'promo_code') {
        const writeOpts = (requireAuth || AUTH_WRITE_ENTITIES.has(entity)) ? { preHandler: [requireAuthPreHandler] } : {};
        fastify.post(`/api/${plural}`, writeOpts, async (request, reply) => {
            const data = validateEntityBody(request.body, reply);
            if (!data) return;
            try {
                return await db.insert(table).values(data).returning().get();
            } catch (e: any) {
                if (e?.message?.includes('UNIQUE') || e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return reply.status(409).send({ error: 'Duplicate entry' });
                }
                throw e;
            }
        });
    }

    if (entity === 'promo_code') {
        fastify.post(`/api/${plural}`, { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
            const body = request.body;
            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return reply.status(400).send({ error: 'Request body must be a JSON object' });
            }
            const tableColumns = Object.keys(table);
            const cleaned: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
                if (tableColumns.includes(key) && key !== 'id') cleaned[key] = value;
            }
            if (!cleaned.code || typeof cleaned.code !== 'string' || !cleaned.code.trim()) {
                return reply.status(400).send({ error: 'code is required' });
            }
            cleaned.code = (cleaned.code as string).trim().toUpperCase();
            if (cleaned.discount_type !== 'percentage' && cleaned.discount_type !== 'fixed') {
                return reply.status(400).send({ error: 'discount_type must be percentage or fixed' });
            }
            const dv = Number(cleaned.discount_value);
            if (!Number.isFinite(dv) || dv <= 0) {
                return reply.status(400).send({ error: 'discount_value must be a positive number' });
            }
            cleaned.discount_value = dv;

            const user = request.user as { id: string; role?: string };
            const shopReq = cleaned.shop_id;
            if (user?.role !== 'admin') {
                if (shopReq == null || shopReq === '') {
                    return reply.status(400).send({ error: 'shop_id is required unless you are an admin' });
                }
                const ids = await getManagedShopIdsForUser(user!.id, request.entityScopeCache);
                if (!ids.includes(String(shopReq))) return reply.status(403).send({ error: 'Forbidden' });
            }

            if (Object.keys(cleaned).length === 0) {
                return reply.status(400).send({ error: 'No valid fields provided' });
            }
            try {
                return await db.insert(table).values(cleaned as any).returning().get();
            } catch (e: any) {
                if (e?.message?.includes('UNIQUE') || e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return reply.status(409).send({ error: 'Duplicate entry' });
                }
                throw e;
            }
        });
    }

    // UPDATE — ownership check for both AUTH_REQUIRED and AUTH_WRITE entities
    const writeRouteOpts = (requireAuth || AUTH_WRITE_ENTITIES.has(entity)) ? { preHandler: [requireAuthPreHandler] } : {};
    const needsOwnershipCheck = requireAuth || AUTH_WRITE_ENTITIES.has(entity);
    fastify.patch(`/api/${plural}/:id`, writeRouteOpts, async (request, reply) => {
        const { id } = request.params as any;
        const data = validateEntityBody(request.body, reply);
        if (!data) return;
        if (entity === 'promo_code' && data.shop_id !== undefined && needsOwnershipCheck) {
            const u = request.user as { id: string; role?: string };
            if (u?.role !== 'admin') {
                const sid = data.shop_id as string | null;
                if (sid == null || sid === '') {
                    return reply.status(403).send({ error: 'Only admins may set platform-wide shop_id' });
                }
                const ids = await getManagedShopIdsForUser(u.id, request.entityScopeCache);
                if (!ids.includes(String(sid))) return reply.status(403).send({ error: 'Invalid shop scope' });
            }
        }
        if (needsOwnershipCheck) {
            const [existing] = await db.select().from(table).where(eq(table.id, id));
            if (
                !existing ||
                !(await rowInScope(entity, table, existing as Record<string, unknown>, request.user as any, request.entityScopeCache))
            )
                return reply.status(404).send({ error: 'Not found' });
        }
        return await db.update(table).set(data).where(eq(table.id, id)).returning().get();
    });

    // DELETE — ownership check for both AUTH_REQUIRED and AUTH_WRITE entities
    fastify.delete(`/api/${plural}/:id`, writeRouteOpts, async (request, reply) => {
        const { id } = request.params as any;
        if (needsOwnershipCheck) {
            const [existing] = await db.select().from(table).where(eq(table.id, id));
            if (
                !existing ||
                !(await rowInScope(entity, table, existing as Record<string, unknown>, request.user as any, request.entityScopeCache))
            )
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

// Auto-seed on first boot: if no barbers exist, populate with sample data
async function autoSeedIfEmpty() {
    try {
        const barbers = await db.select({ id: schema.barbers.id }).from(schema.barbers).limit(1);
        if (barbers.length === 0) {
            fastify.log.info('No barbers found — seeding sample data...');
            const { execSync } = await import('child_process');
            try {
                execSync('node --import tsx src/db/seed.ts', { cwd: process.cwd(), stdio: 'inherit', timeout: 30000 });
                fastify.log.info('Database seeded successfully.');
            } catch (seedErr: any) {
                fastify.log.warn(`Seed script failed: ${seedErr.message}. App will start with empty data.`);
            }
        }
    } catch (e: any) {
        fastify.log.warn(`Auto-seed check skipped: ${e.message}`);
    }
}

// START SERVER
const start = async () => {
    try {
        await autoSeedIfEmpty();
        const port = Number(process.env.PORT) || 3001;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Sovereign Backend running on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

/** For Vitest `fastify.inject` integration tests (`import { fastify } from '../index'`); avoids binding a port. */
export { fastify };

if (process.env.VITEST !== 'true') {
    void start();
}
