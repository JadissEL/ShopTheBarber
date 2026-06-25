import './loadEnv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Prisma } from '@prisma/client';
import { prisma } from './db/prisma';
import { z } from 'zod';

// Fail-fast environment validation. Neon (DATABASE_URL) and Clerk (CLERK_SECRET_KEY)
// are mandatory in production; missing config must not start a half-working server.
(() => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const dbUrl = process.env.DATABASE_URL || (isTest ? process.env.TEST_DATABASE_URL : undefined);
    const missing: string[] = [];
    if (!dbUrl) missing.push('DATABASE_URL');
    if (isProd && !process.env.CLERK_SECRET_KEY) missing.push('CLERK_SECRET_KEY');
    if (missing.length) {
        const msg = `FATAL: missing required environment variable(s): ${missing.join(', ')}. See server/.env.example.`;
        if (isProd || !dbUrl) {
            console.error(msg);
            process.exit(1);
        } else {
            console.warn(msg);
        }
    }
})();

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

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: process.env.FRONTEND_URL || true,
    credentials: true
});
// Security headers. CSP disabled here (API serves JSON, not HTML); the frontend host sets its own CSP.
fastify.register(helmet, { contentSecurityPolicy: false });

/** Entities that require auth for all access (list/get/create/update/delete). */
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

/** Maps the public entity name (singular) to its Prisma model / table name. */
const ENTITY_TABLE: Record<string, string> = {
    barber: 'barbers', shop: 'shops', service: 'services', booking: 'bookings',
    loyalty_profile: 'loyalty_profiles', loyalty_transaction: 'loyalty_transactions',
    message: 'messages', notification: 'notifications', dispute: 'disputes', audit_log: 'audit_logs',
    shop_member: 'shop_members', pricing_rule: 'pricing_rules', waiting_list_entry: 'waiting_list_entries',
    staff_service_config: 'staff_service_configs', review: 'reviews', payout: 'payouts', shift: 'shifts',
    time_block: 'time_blocks', favorite: 'favorites', product: 'products', brand: 'brands',
    brand_accolade: 'brand_accolades', brand_collection: 'brand_collections', promo_code: 'promo_codes',
    inspiration_post: 'inspiration_posts', article: 'articles', gift_card: 'gift_cards', referral: 'referrals',
    wallet_account: 'wallet_accounts', wallet_transaction: 'wallet_transactions', wishlist_item: 'wishlist_items',
    barber_video: 'barber_videos', feature_flag: 'feature_flags', shop_inventory_item: 'shop_inventory_items',
    shop_expense: 'shop_expenses', legal_document: 'legal_documents',
};

/** Scalar (non-relation) field names per Prisma model, for write allow-listing. */
const MODEL_SCALAR_FIELDS = new Map<string, Set<string>>();
for (const m of Prisma.dmmf.datamodel.models) {
    MODEL_SCALAR_FIELDS.set(m.name, new Set(m.fields.filter(f => f.kind !== 'object').map(f => f.name)));
}

const delegate = (tableName: string): any => (prisma as any)[tableName];

/** Returns true for a Postgres "relation/table does not exist" error. */
function isDbSchemaError(e: any): boolean {
    const code = e?.code || e?.meta?.code;
    if (code === '42P01' || code === 'P2021' || code === 'P2010') return true;
    const msg = (e?.message || '').toLowerCase();
    return msg.includes('does not exist') && msg.includes('relation');
}

function isUniqueViolation(e: any): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

// Sovereign auth: Clerk session JWT → DB users.id for FK scope.
async function requireAuthPreHandler(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return;
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

// --- ROUTES ---

// Health check (no auth) — confirms DB is reachable
fastify.get('/api/health', async (_request, reply) => {
    try {
        await prisma.users.findFirst({ select: { id: true } });
        return { ok: true, db: 'ok' };
    } catch (e: any) {
        fastify.log.error(e);
        return reply.status(503).send({
            ok: false,
            error: 'Database unavailable',
            hint: "Run 'npm run migrate' (Neon) in the server folder."
        });
    }
});

// 0. Auth Routes (Clerk-only: /me, /logout)
import { authRoutes } from './auth/routes';
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

// 2. Calculate Taxes
fastify.post('/api/functions/calculate-taxes', async (request, reply) => {
    const { amount, country_code = 'GR', entity_type = 'service_provider', tax_year } = request.body as any;
    if (!amount || amount <= 0) {
        return reply.status(400).send({ error: 'Valid amount required' });
    }

    function calculateGreeceTaxes(amount: number, entity_type: string) {
        const breakdown: any = {};
        const vatRate = 0.24;
        const vatAmount = amount * vatRate;
        breakdown.vat = { name: 'VAT (Φ.Π.Α)', rate: vatRate, amount: Math.round(vatAmount * 100) / 100, description: 'Value Added Tax' };
        if (entity_type === 'service_provider') {
            const withholdingRate = 0.15;
            const withholdingAmount = amount * withholdingRate;
            breakdown.withholding_tax = { name: 'Withholding Tax (Κ.Π.Δ)', rate: withholdingRate, amount: Math.round(withholdingAmount * 100) / 100, description: 'Tax withheld at source for freelancers' };
        }
        if (entity_type === 'self_employed') {
            const socialSecurityRate = 0.20;
            const socialSecurityAmount = amount * socialSecurityRate;
            breakdown.social_security = { name: 'Social Security (ΙΚΑ-ΕΤΑΜ)', rate: socialSecurityRate, amount: Math.round(socialSecurityAmount * 100) / 100, description: 'Social security contributions' };
        }
        if (entity_type === 'barber' || entity_type === 'shop') {
            const professionalRate = 0.02;
            const professionalAmount = amount * professionalRate;
            breakdown.professional_fee = { name: 'Professional Fee', rate: professionalRate, amount: Math.round(professionalAmount * 100) / 100, description: 'Chamber of commerce or professional association fee' };
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

// 3. Calculate Commission and Fees (auth + booking scope)
fastify.post('/api/functions/calculate-fees', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { action, context, booking_id } = request.body as any;
    const currentUser = request.user as { id: string };

    const ensureBookingScope = async (bid: string) => {
        const booking = await prisma.bookings.findUnique({ where: { id: bid } });
        if (!booking || !(await rowInScope('booking', booking as Record<string, unknown>, currentUser, request.entityScopeCache)))
            return reply.status(403).send({ error: 'Forbidden' });
    };

    const bid = (context?.booking_id ?? booking_id) as string | undefined;
    if (bid && (action === 'calculateFees' || action === 'calculateRefund' || action === 'verifyLocked')) {
        await ensureBookingScope(bid);
        if (reply.sent) return;
    }

    if (action === 'calculateFees') {
        const { booking_id, base_price, tax_amount = 0, discount_amount = 0, barber_id, shop_id, context_type } = context;
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

        const existing = await prisma.bookings.findUnique({ where: { id: booking_id } });
        if (existing?.financial_breakdown && existing.status === 'confirmed') {
            return {
                status: 'ALREADY_CALCULATED',
                financial_breakdown: JSON.parse(existing.financial_breakdown as string),
                message: 'Fees already locked for this booking'
            };
        }

        await prisma.bookings.update({
            where: { id: booking_id },
            data: { financial_breakdown: JSON.stringify(financial_breakdown), price_at_booking: final_price },
        });

        await prisma.audit_logs.create({
            data: {
                action: 'COMMISSION_CALCULATED',
                resource_type: 'Booking',
                resource_id: booking_id,
                actor_id: 'system',
                changes: JSON.stringify({ financial_breakdown, locked: true }),
                details: JSON.stringify({ barber_id, shop_id, context_type, fee_rate: effectiveFeeRate })
            },
        });

        return { status: 'CALCULATED', booking_id, financial_breakdown, provider_payout, platform_revenue: platform_fee, locked: true };
    }

    if (action === 'calculateRefund') {
        const booking = await prisma.bookings.findUnique({ where: { id: booking_id } });
        if (!booking?.financial_breakdown) {
            return reply.status(400).send({ error: 'Cannot refund: no financial breakdown found' });
        }
        const financial_breakdown = JSON.parse(booking.financial_breakdown as string);
        const bookingDate = new Date(booking.start_time);
        const now = new Date();
        const hoursBefore = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        let refund_percentage;
        if (hoursBefore > 24) refund_percentage = 1.0;
        else if (hoursBefore > 2) refund_percentage = 0.5;
        else refund_percentage = 0.0;
        const refund_amount = Math.round(financial_breakdown.final_price * refund_percentage * 100) / 100;
        const platform_fee_refund = Math.round(financial_breakdown.platform_fee * refund_percentage * 100) / 100;
        return { refund_amount, platform_fee_refund, refund_percentage, hours_before_appointment: Math.round(hoursBefore), locked_breakdown: financial_breakdown };
    }

    if (action === 'verifyLocked') {
        const booking = await prisma.bookings.findUnique({ where: { id: booking_id } });
        if (!booking?.financial_breakdown) {
            return reply.status(400).send({ error: `Booking ${booking_id} has no financial breakdown locked` });
        }
        return { locked: true, breakdown: JSON.parse(booking.financial_breakdown as string), cannot_modify: true };
    }

    return reply.status(400).send({ error: 'Invalid action' });
});

// 4. Send Booking Email (auth required)
fastify.post('/api/functions/send-booking-email', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { action, booking, cancelledBy } = request.body as any;
    try {
        if (action === 'confirmation' || action === 'create') {
            await sendEmail({
                to: booking.client_email || 'client@example.com',
                subject: `Booking Confirmed - ${booking.service_name}`,
                template: 'confirmation',
                data: {
                    clientName: booking.client_name, barberName: booking.barber_name, date: booking.date_text,
                    time: booking.time_text, serviceName: booking.service_name, location: booking.location,
                    price: `${booking.price_at_booking} EUR`
                }
            });
        } else if (action === 'cancellation' || action === 'cancel') {
            await sendEmail({
                to: booking.client_email || 'client@example.com',
                subject: `Booking Cancelled - ${booking.service_name}`,
                template: 'cancellation',
                data: {
                    clientName: booking.client_name, serviceName: booking.service_name, date: booking.date_text,
                    time: booking.time_text, cancelledBy: cancelledBy || 'user',
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
    const user = await prisma.users.findUnique({ where: { id: uid } });
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
    const accountId = `acct_mock_${Math.random().toString(36).substring(7)}`;
    await prisma.users.update({
        where: { id: uid },
        data: { stripe_account_id: accountId, stripe_connect_status: 'pending' },
    });
    return { data: { url: `https://connect.stripe.com/express/onboarding/mock?account=${accountId}`, accountId } };
});

// 7. Stripe Webhook Handler
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

// 8. Public active promotions (anonymous-friendly)
fastify.get('/api/public/active-promotions', async (request, reply) => {
    try {
        const barberId = (request.query as { barber_id?: string }).barber_id;

        if (barberId) {
            const barber = await prisma.barbers.findUnique({ where: { id: barberId }, select: { shop_id: true } });
            const shopId = barber?.shop_id ?? null;
            const scope = shopId ? { OR: [{ shop_id: shopId }, { shop_id: null }] } : { shop_id: null };
            const rows = await prisma.promo_codes.findMany({ where: { AND: [{ is_active: true }, scope] } });
            return rows.map((r) => ({
                id: r.id, code: r.code, shop_id: r.shop_id, discount_type: r.discount_type, discount_value: r.discount_value,
                type: r.shop_id ? 'shop' : 'general',
                discount_text: r.discount_type === 'percentage' ? `${r.discount_value}% off` : `$${r.discount_value} off`,
                title: r.shop_id ? 'Shop offer' : 'Platform offer',
                description: 'Limited time offer',
            }));
        }

        const platform = await prisma.promo_codes.findMany({ where: { is_active: true, shop_id: null }, select: { id: true } });
        const shopRows = await prisma.promo_codes.findMany({
            where: { is_active: true, shop_id: { not: null } },
            select: { shop_id: true },
            distinct: ['shop_id'],
        });
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

// 9. Moderation Notification (Admin Only)
fastify.post('/api/admin/moderation/notify', { preHandler: [requireAdminPreHandler] }, async (request, reply) => {
    try {
        const result = await notifyUserOfModerationAction(request.body as any);
        return result;
    } catch (e: any) {
        return reply.status(400).send({ error: e.message });
    }
});

// 10. Backup Integrity Verification (Admin Only)
fastify.post('/api/admin/backup/verify', { preHandler: [requireAdminPreHandler] }, async (request, reply) => {
    try {
        const { admin_user_id } = request.body as any;
        const result = await verifyBackupIntegrity(admin_user_id || 'system');
        return result;
    } catch (e: any) {
        return reply.status(500).send({ error: e.message });
    }
});

// 12. Provider Analytics (auth required)
import { getProviderAnalytics } from './provider/analytics';
fastify.post('/api/functions/provider-analytics', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const { shopId, barberId } = request.body as { shopId?: string; barberId?: string };
        if (!shopId && !barberId) {
            return reply.status(400).send({ error: 'shopId or barberId required' });
        }
        const currentUser = request.user as { id: string };
        if (barberId) {
            const barber = await prisma.barbers.findUnique({ where: { id: barberId }, select: { user_id: true } });
            if (!barber || barber.user_id !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
        } else if (shopId) {
            const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { owner_id: true } });
            if (!shop) return reply.status(403).send({ error: 'Forbidden' });
            const isOwner = shop.owner_id === currentUser.id;
            const members = await prisma.shop_members.findMany({ where: { shop_id: shopId }, select: { user_id: true } });
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

// 13. Chat / Conversations (auth required: own conversations only)
fastify.get('/api/conversations/:userId', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const { userId } = request.params as any;
    const currentUser = request.user as { id: string };
    if (currentUser?.id !== userId) return reply.status(403).send({ error: 'Forbidden' });

    const received = await prisma.messages.findMany({ where: { receiver_id: userId }, select: { sender_id: true } });
    const sent = await prisma.messages.findMany({ where: { sender_id: userId }, select: { receiver_id: true } });
    const contactIds = Array.from(new Set([
        ...received.map(r => r.sender_id),
        ...sent.map(r => r.receiver_id),
    ].filter(Boolean) as string[]));

    if (contactIds.length === 0) return [];
    return prisma.users.findMany({ where: { id: { in: contactIds } } });
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

// Generic entity routes (Prisma)
const entities = Object.keys(ENTITY_TABLE);

entities.forEach(entity => {
    const tableName = ENTITY_TABLE[entity];
    const plural = `/api/${entity}s`.replace(/ys$/, 'ies'); // route path base
    const routeBase = `/api/${tableName}`;
    const requireAuth = AUTH_REQUIRED_ENTITIES.has(entity);
    const routeOpts = requireAuth ? { preHandler: [requireAuthPreHandler] } : {};
    const allowedFields = MODEL_SCALAR_FIELDS.get(tableName) ?? new Set<string>();
    const model = () => delegate(tableName);

    // LIST (with optional server-side pagination via ?limit=&offset=&order=)
    fastify.get(routeBase, routeOpts, async (request, reply) => {
        try {
            const qs = request.query as { limit?: string; offset?: string; order?: string };
            const take = Math.min(Math.max(parseInt(qs.limit || '200', 10) || 200, 1), 1000);
            const skip = Math.max(parseInt(qs.offset || '0', 10) || 0, 0);

            const args: any = { take, skip };
            if (requireAuth) {
                const user = request.user as { id: string; role?: string };
                const scope = await getEntityScopeCondition(entity, user, request.entityScopeCache);
                if (scope) args.where = scope;
            }
            if (qs.order && typeof qs.order === 'string') {
                const isDesc = qs.order.startsWith('-');
                const field = isDesc ? qs.order.substring(1) : qs.order;
                if (allowedFields.has(field) || field === 'id') {
                    args.orderBy = { [field]: isDesc ? 'desc' : 'asc' };
                }
            }
            const rows = await model().findMany(args);
            return Array.isArray(rows) ? rows : [];
        } catch (e: any) {
            fastify.log.error(`Error listing ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({ error: 'Database schema not ready', hint: "Run 'npm run migrate' in the server folder." });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET BY ID
    fastify.get(`${routeBase}/:id`, routeOpts, async (request, reply) => {
        try {
            const { id } = request.params as any;
            const row = await model().findUnique({ where: { id } });
            if (!row) return reply.status(404).send({ error: 'Not found' });
            if (requireAuth && !(await rowInScope(entity, row as Record<string, unknown>, request.user as any, request.entityScopeCache)))
                return reply.status(404).send({ error: 'Not found' });
            return row;
        } catch (e: any) {
            fastify.log.error(`Error getting ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({ error: 'Database schema not ready', hint: "Run 'npm run migrate' in the server folder." });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // FILTER (Advanced Query)
    fastify.post(`${routeBase}/filter`, routeOpts, async (request, reply) => {
        const body = (request.body || {}) as { query?: Record<string, unknown>; order?: string; limit?: number; offset?: number };
        const rowQuery = body.query && typeof body.query === 'object' ? body.query : {};
        const order = body.order;
        const take = Math.min(Math.max(Number(body.limit ?? 200) || 200, 1), 1000);
        const skip = Math.max(Number(body.offset ?? 0) || 0, 0);

        const fieldWhere: Record<string, any> = {};
        Object.entries(rowQuery).forEach(([field, value]) => {
            if (!allowedFields.has(field) && field !== 'id') return;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const cond: Record<string, any> = {};
                Object.entries(value as Record<string, unknown>).forEach(([op, val]) => {
                    if (op === '$in' && Array.isArray(val) && val.length > 0) cond.in = val;
                    else if (op === '$nin' && Array.isArray(val) && val.length > 0) cond.notIn = val;
                    else if (op === '$gt') cond.gt = val;
                    else if (op === '$lt') cond.lt = val;
                    else if (op === '$gte') cond.gte = val;
                    else if (op === '$lte') cond.lte = val;
                    else if (op === '$ne') cond.not = val;
                });
                if (Object.keys(cond).length > 0) fieldWhere[field] = cond;
            } else {
                fieldWhere[field] = value;
            }
        });

        let where: any = fieldWhere;
        if (requireAuth) {
            const scope = await getEntityScopeCondition(entity, request.user as any, request.entityScopeCache);
            if (scope) where = { AND: [scope, fieldWhere] };
        }

        const args: any = { where, take, skip };
        if (order && typeof order === 'string') {
            const isDesc = order.startsWith('-');
            const field = isDesc ? order.substring(1) : order;
            if (allowedFields.has(field) || field === 'id') {
                args.orderBy = { [field]: isDesc ? 'desc' : 'asc' };
            }
        }

        try {
            return await model().findMany(args);
        } catch (e: any) {
            fastify.log.error(`Error filtering ${entity}: ${e.message}`);
            if (isDbSchemaError(e)) {
                return reply.status(503).send({ error: 'Database schema not ready', hint: "Run 'npm run migrate' in the server folder." });
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
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
            if (allowedFields.has(key) && key !== 'id') cleaned[key] = value;
        }
        if (Object.keys(cleaned).length === 0) {
            reply.status(400).send({ error: 'No valid fields provided' });
            return null;
        }
        return cleaned;
    };

    // CREATE (booking/review/promo_code have custom create paths)
    if (entity !== 'booking' && entity !== 'review' && entity !== 'promo_code') {
        const writeOpts = (requireAuth || AUTH_WRITE_ENTITIES.has(entity)) ? { preHandler: [requireAuthPreHandler] } : {};
        fastify.post(routeBase, writeOpts, async (request, reply) => {
            const data = validateEntityBody(request.body, reply);
            if (!data) return;
            try {
                return await model().create({ data });
            } catch (e: any) {
                if (isUniqueViolation(e)) return reply.status(409).send({ error: 'Duplicate entry' });
                throw e;
            }
        });
    }

    if (entity === 'promo_code') {
        fastify.post(routeBase, { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
            const body = request.body;
            if (!body || typeof body !== 'object' || Array.isArray(body)) {
                return reply.status(400).send({ error: 'Request body must be a JSON object' });
            }
            const cleaned: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
                if (allowedFields.has(key) && key !== 'id') cleaned[key] = value;
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
            try {
                return await model().create({ data: cleaned });
            } catch (e: any) {
                if (isUniqueViolation(e)) return reply.status(409).send({ error: 'Duplicate entry' });
                throw e;
            }
        });
    }

    // UPDATE — ownership check for AUTH_REQUIRED and AUTH_WRITE entities
    const writeRouteOpts = (requireAuth || AUTH_WRITE_ENTITIES.has(entity)) ? { preHandler: [requireAuthPreHandler] } : {};
    const needsOwnershipCheck = requireAuth || AUTH_WRITE_ENTITIES.has(entity);
    fastify.patch(`${routeBase}/:id`, writeRouteOpts, async (request, reply) => {
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
            const existing = await model().findUnique({ where: { id } });
            if (!existing || !(await rowInScope(entity, existing as Record<string, unknown>, request.user as any, request.entityScopeCache)))
                return reply.status(404).send({ error: 'Not found' });
        }
        try {
            return await model().update({ where: { id }, data });
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
                return reply.status(404).send({ error: 'Not found' });
            }
            throw e;
        }
    });

    // DELETE — ownership check for AUTH_REQUIRED and AUTH_WRITE entities
    fastify.delete(`${routeBase}/:id`, writeRouteOpts, async (request, reply) => {
        const { id } = request.params as any;
        if (needsOwnershipCheck) {
            const existing = await model().findUnique({ where: { id } });
            if (!existing || !(await rowInScope(entity, existing as Record<string, unknown>, request.user as any, request.entityScopeCache)))
                return reply.status(404).send({ error: 'Not found' });
        }
        try {
            return await model().delete({ where: { id } });
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
                return reply.status(404).send({ error: 'Not found' });
            }
            throw e;
        }
    });
});

// Global error handler: ensure 500 responses are always JSON
fastify.setErrorHandler((err: any, request, reply) => {
    fastify.log.error({ err, message: err?.message, code: err?.code, stack: err?.stack, url: request?.url }, 'UNHANDLED_ERROR');
    const status = err.statusCode ?? 500;
    const body = {
        error: err.message || 'Internal Server Error',
        hint: status === 500 ? 'Check server logs.' : undefined
    };
    return reply.status(status).type('application/json').send(body);
});

// Auto-seed on first boot: if no barbers exist, populate with sample data
async function autoSeedIfEmpty() {
    try {
        const barber = await prisma.barbers.findFirst({ select: { id: true } });
        if (!barber) {
            fastify.log.info('No barbers found — seeding sample data...');
            const { execSync } = await import('child_process');
            try {
                execSync('node --import tsx src/db/seed.ts', { cwd: process.cwd(), stdio: 'inherit', timeout: 60000 });
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

/** For Vitest `fastify.inject` integration tests; avoids binding a port. */
export { fastify };

if (process.env.VITEST !== 'true') {
    void start();
}
