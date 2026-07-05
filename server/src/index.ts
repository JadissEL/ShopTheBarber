import './loadEnv';
import { initSentry, captureException } from './observability/sentry';
initSentry();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Prisma } from '@prisma/client';
import { prisma } from './db/prisma';
import { isProductionGeocodingConfigured } from './lib/geocoding';

// Fail-fast environment validation. Core vars must be set in production; payments,
// rate limiting, and geocoding warn at startup until configured (see /AdminKeysWalkthrough).
(() => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const dbUrl = process.env.DATABASE_URL || (isTest ? process.env.TEST_DATABASE_URL : undefined);
    const missingCritical: string[] = [];
    const missingDeferred: string[] = [];
    if (!dbUrl) missingCritical.push('DATABASE_URL');
    if (isProd && !process.env.CLERK_SECRET_KEY) missingCritical.push('CLERK_SECRET_KEY');
    if (isProd && !process.env.FRONTEND_URL) missingCritical.push('FRONTEND_URL');
    if (isProd && !process.env.CRON_SECRET) missingCritical.push('CRON_SECRET');
    if (isProd && !process.env.STRIPE_API_KEY) missingDeferred.push('STRIPE_API_KEY');
    if (isProd && !process.env.STRIPE_WEBHOOK_SECRET) missingDeferred.push('STRIPE_WEBHOOK_SECRET');
    if (isProd && !process.env.STRIPE_PUBLISHABLE_KEY) missingDeferred.push('STRIPE_PUBLISHABLE_KEY');
    if (isProd && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
        missingDeferred.push('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
    }
    if (isProd && !isProductionGeocodingConfigured()) {
        missingDeferred.push('MAPBOX_ACCESS_TOKEN or GOOGLE_MAPS_API_KEY');
    }
    if (missingCritical.length) {
        const msg = `FATAL: missing required environment variable(s): ${missingCritical.join(', ')}. See server/.env.example.`;
        if (isProd || !dbUrl) {
            console.error(msg);
            process.exit(1);
        } else {
            console.warn(msg);
        }
    }
    if (isProd && missingDeferred.length) {
        console.warn(
            `WARN: production missing optional-until-launch config: ${missingDeferred.join(', ')}. ` +
                'Payments, distributed rate limits, and geocoding may be degraded. See /AdminKeysWalkthrough.'
        );
    }
})();

import { validateBooking, createBookingLogic } from './logic/booking';
import { listBarberDaySlots } from './logic/slotAvailability';
import { assertNoPostConfirmPriceChange } from './domain/booking/priceLock';
import { validateGuestContact, normalizeGuestContact } from './logic/guestBookingValidation';
import {
    findGuestBookingByToken,
    getGuestCancellationPreview,
    cancelGuestBooking,
    claimGuestBookingForUser,
    claimPendingGuestBookingsForUser,
    claimGuestBookingsByTokens,
} from './logic/guestBooking';
import crypto from 'crypto';
import { handleStripeWebhook } from './webhooks/stripe';
import { checkStripeConnectStatusForUser, initiateStripeConnectForUser } from './stripe/connect';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { isIpRateLimitAllowed } from './lib/ipRateLimit';
import { enrichBarberLocationFields } from './lib/geocoding/barberLocation';
import { validatePromoCode } from './logic/promoCode';
import { notifyUserOfModerationAction } from './logic/moderation';
import { verifyBackupIntegrity } from './admin/backup';
import { sendEmail } from './logic/email';
import { createEntityScopeCache, getEntityScopeCondition, getManagedShopIdsForUser, rowInScope } from './entityScope';
import { authenticateRequest } from './auth/requestUser';
import { runHealthCheck } from './observability/health';
import { serializeBookingRow, serializeBookingRows } from './logic/bookingSerialize';
import {
    assertAtLeastOneServiceLocation,
    offersMobileService,
    offersShopService,
} from './lib/serviceLocation';

const fastify = Fastify({
    logger: true
});

declare module 'fastify' {
    interface FastifyRequest {
        rawBody?: string;
    }
}

fastify.addHook('preParsing', async (request, _reply, payload) => {
    if (request.method === 'POST' && request.url.startsWith('/api/webhooks/stripe')) {
        const chunks: Buffer[] = [];
        for await (const chunk of payload as AsyncIterable<Buffer | string>) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const raw = Buffer.concat(chunks);
        request.rawBody = raw.toString('utf8');
        const { Readable } = await import('stream');
        return Readable.from(raw);
    }
    return payload;
});

const isProdRuntime = process.env.NODE_ENV === 'production';
const frontendOrigin = process.env.FRONTEND_URL?.replace(/\/$/, '');

fastify.register(cors, {
    origin: isProdRuntime
        ? (frontendOrigin ? [frontendOrigin] : false)
        : (process.env.FRONTEND_URL || true),
    credentials: true
});
// Security headers. CSP disabled here (API serves JSON, not HTML); the frontend host sets its own CSP.
fastify.register(helmet, { contentSecurityPolicy: false });

/** Entities managed only via dedicated API routes, block generic entity CRUD writes. */
const DEDICATED_API_ENTITIES = new Set([
    'loyalty_profile',
    'loyalty_transaction',
    'product',
    'referral',
    'wallet_account',
    'wallet_transaction',
    'message',
    'booking_tip',
    'saved_address',
    'seller_shipping_profile',
    'order_fulfillment',
    'support_ticket',
    'weekly_draw',
    'draw_entry',
    'platform_event',
    'event_registration',
    'provider_fee_wallet',
    'provider_fee_transaction',
]);

const LOYALTY_WRITE_MESSAGE =
    'Loyalty balances are managed by the platform. Use GET/POST /api/loyalty/* instead.';

const REFERRAL_WRITE_MESSAGE =
    'Referrals are managed by the platform. Use GET/POST /api/referral/* instead.';

const WALLET_WRITE_MESSAGE =
    'Wallet balances are managed by the platform. Use GET /api/wallet/me instead.';

const MESSAGE_WRITE_MESSAGE =
    'Messages are managed via GET/POST /api/messages/* (chat, reschedule actions).';

const _TIP_WRITE_MESSAGE =
    'Tips are managed via GET/POST /api/tips/* (post-service pourboires).';

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
    'barber', 'shop', 'service', 'shift', 'time_block', 'shop_member', 'staff_service_config', 'review',
    'shop_inventory_item', 'shop_expense', 'barber_video', 'inspiration_post', 'legal_document',
]);

/** Generic entity writes blocked, use dedicated routes instead. */
const GENERIC_WRITE_BLOCKED_ENTITIES = new Set(['booking', 'feature_flag']);

/** Admin-only generic entity writes. */
const ADMIN_ONLY_WRITE_ENTITIES = new Set(['pricing_rule']);

function blockGenericEntityWrite(
    entity: string,
    reply: { status: (code: number) => { send: (body: unknown) => void } },
    user?: { role?: string }
): boolean {
    if (GENERIC_WRITE_BLOCKED_ENTITIES.has(entity)) {
        if (entity === 'booking') {
            reply.status(403).send({ error: 'Use POST /api/bookings and payment protection routes for bookings' });
        } else {
            reply.status(403).send({ error: 'Use /api/admin/feature-flags for feature toggles' });
        }
        return true;
    }
    if (ADMIN_ONLY_WRITE_ENTITIES.has(entity) && user?.role !== 'admin') {
        reply.status(403).send({ error: 'Admin access required for this resource' });
        return true;
    }
    return false;
}

/** Maps the public entity name (singular) to its Prisma model / table name. */
const ENTITY_TABLE: Record<string, string> = {
    barber: 'barbers', shop: 'shops', service: 'services', booking: 'bookings',
    loyalty_profile: 'loyalty_profiles', loyalty_transaction: 'loyalty_transactions',
    message: 'messages', notification: 'notifications', dispute: 'disputes', audit_log: 'audit_logs',
    shop_member: 'shop_members', pricing_rule: 'pricing_rules', waiting_list_entry: 'waiting_list_entries',
    staff_service_config: 'staff_service_configs', review: 'reviews', payout: 'payouts', shift: 'shifts',
    time_block: 'time_blocks', favorite: 'favorites', brand: 'brands',
    brand_accolade: 'brand_accolades', brand_collection: 'brand_collections', promo_code: 'promo_codes',
    inspiration_post: 'inspiration_posts', gift_card: 'gift_cards', referral: 'referrals',
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

// Sovereign auth: Clerk session JWT DB users.id for FK scope.
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

// Health checks (no auth), wire uptime monitors to /api/health/live and /api/health/ready
fastify.get('/api/health/live', async () => ({ ok: true, status: 'alive' }));

fastify.get('/api/health/ready', async (_request, reply) => {
    const result = await runHealthCheck(true);
    if (!result.ok) {
        return reply.status(503).send(result);
    }
    return result;
});

fastify.get('/api/health', async (_request, reply) => {
    const deep = process.env.NODE_ENV === 'production';
    const result = await runHealthCheck(deep);
    if (!result.ok) {
        return reply.status(503).send(result);
    }
    return result;
});

import { getPublicStatusPage } from './observability/statusPublic';
fastify.get('/api/status/public', async (_request, reply) => {
    const status = await getPublicStatusPage();
    const code = status.overall_status === 'outage' ? 503 : 200;
    return reply.status(code).send(status);
});

import { getConfigReadiness } from './admin/configReadiness';
fastify.get('/api/admin/config-readiness', { preHandler: [requireAdminPreHandler] }, async (_request, _reply) => {
    return getConfigReadiness();
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

import { articlesRoutes } from './articles/routes';
fastify.register(articlesRoutes);

import { marketplaceRoutes } from './marketplace/routes';
fastify.register(marketplaceRoutes);

import { pricingRoutes } from './pricing/routes';
import { loyaltyRoutes } from './loyalty/routes';
import { referralRoutes } from './referral/routes';
import { walletRoutes } from './wallet/routes';
import { messageRoutes } from './messages/routes';
import { tipRoutes } from './tips/routes';
import { shippingRoutes } from './shipping/routes';
import { supportRoutes } from './support/routes';
import { tombolaRoutes } from './tombola/routes';
import { eventsRoutes } from './events/routes';
import { providerWalletRoutes } from './providerWallet/routes';
import { languagesRoutes } from './languages/routes';
import { languageProgramsRoutes } from './languagePrograms/routes';
import { childrenFriendlyRoutes } from './childrenFriendly/routes';
import { providerAttestationRoutes } from './providerAttestation/routes';
import { productAnalyticsRoutes } from './productAnalytics/routes';
import { fixedFeeRoutes } from './fixedFee/routes';
import { promotionsRoutes } from './promotions/routes';
import { homeRoutes } from './home/routes';
import { mobileServiceRoutes } from './mobileService/routes';
import { serviceLocationRoutes } from './serviceLocation/routes';
import { atHomeServiceRoutes } from './atHomeService/routes';
import { geocodingRoutes } from './geocoding/routes';
import { providerStatsRoutes } from './providerStats/routes';
import { providerShowcaseRoutes } from './providerShowcase/routes';
import { groupBookingRoutes } from './groupBooking/routes';
import { seoRoutes } from './seo/routes';
import { reminderRoutes } from './reminders/routes';
import { paymentProtectionRoutes } from './paymentProtection/routes';
import { capacityRoutes } from './domain/capacity/routes';
import { domainBookingRoutes, waitlistRoutes } from './domain/routes';
import { financialTrustRoutes } from './financialTrustRoutes';
import { promoAppliesToBarberContext, resolveAudience } from './promotions/targeting';
import { shouldWaiveCommissionForBooking, runFixedFeeMaintenance } from './fixedFee/logic';
import { getActivePricingPolicy } from './pricing/logic';
import { shopRoutes } from './shop/routes';
fastify.register(pricingRoutes);
fastify.register(loyaltyRoutes);
fastify.register(referralRoutes);
fastify.register(walletRoutes);
fastify.register(messageRoutes);
fastify.register(tipRoutes);
fastify.register(shippingRoutes);
fastify.register(supportRoutes);
fastify.register(tombolaRoutes);
fastify.register(eventsRoutes);
fastify.register(providerWalletRoutes);
fastify.register(languagesRoutes);
fastify.register(languageProgramsRoutes);
fastify.register(childrenFriendlyRoutes);
fastify.register(providerAttestationRoutes);
fastify.register(productAnalyticsRoutes);
fastify.register(fixedFeeRoutes);
fastify.register(promotionsRoutes);
fastify.register(homeRoutes);
fastify.register(mobileServiceRoutes);
fastify.register(serviceLocationRoutes);
fastify.register(atHomeServiceRoutes);
fastify.register(geocodingRoutes);
fastify.register(providerStatsRoutes);
fastify.register(providerShowcaseRoutes);
fastify.register(groupBookingRoutes);
fastify.register(seoRoutes);
fastify.register(reminderRoutes);
fastify.register(paymentProtectionRoutes);
fastify.register(capacityRoutes);
fastify.register(domainBookingRoutes);
fastify.register(waitlistRoutes);
fastify.register(financialTrustRoutes);
import { featureFlagRoutes } from './featureFlags/routes';
fastify.register(featureFlagRoutes);
fastify.register(shopRoutes);

import { enforcePromoOnWrite, enforceServicePriceOnWrite } from './pricing/enforce';

import { privacyRoutes } from './privacy/routes';
fastify.register(privacyRoutes);

// 1. Validate Booking Availability (rate-limited: 30 per minute per IP)
fastify.post('/api/functions/validate-availability', async (request, reply) => {
    const ip = request.ip || 'unknown';
    if (!(await isIpRateLimitAllowed('avail', ip, 30, 60_000))) {
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

fastify.get<{ Params: { barberId: string }; Querystring: { date?: string; duration?: string; shop_id?: string; context_type?: string } }>(
    '/api/barbers/:barberId/day-slots',
    async (request, reply) => {
        const ip = request.ip || 'unknown';
        if (!(await isIpRateLimitAllowed('day-slots', ip, 60, 60_000))) {
            return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
        }
        const { barberId } = request.params;
        const { date, duration, shop_id, context_type } = request.query;
        if (!date) {
            return reply.status(400).send({ error: 'date query param is required (YYYY-MM-DD)' });
        }
        try {
            return await listBarberDaySlots({
                barberId,
                shopId: shop_id ?? null,
                date,
                durationMinutes: duration ? parseInt(duration, 10) : 30,
                contextType: context_type,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load slots';
            return reply.status(400).send({ error: msg });
        }
    }
);

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
        if (!booking || !(await rowInScope('booking', booking, currentUser, request.entityScopeCache)))
            {return reply.status(403).send({ error: 'Forbidden' });}
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
        const policy = await getActivePricingPolicy();
        const effectiveFeeRate =
            (await shouldWaiveCommissionForBooking(barber_id, shop_id ?? null))
                ? 0
                : context_type === 'shop'
                  ? policy.commission_shop
                  : policy.commission_freelancer;
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
            currency: 'EUR',
            calculated_at: new Date().toISOString(),
            calculated_by: 'sovereign-backend'
        };

        const existing = await prisma.bookings.findUnique({ where: { id: booking_id } });
        if (existing?.financial_breakdown && existing.status === 'confirmed') {
            return {
                status: 'ALREADY_CALCULATED',
                financial_breakdown: JSON.parse(existing.financial_breakdown),
                message: 'Fees already locked for this booking'
            };
        }

        if (
            existing &&
            ['confirmed', 'completed'].includes(existing.status || '') &&
            existing.price_at_booking != null
        ) {
            assertNoPostConfirmPriceChange({
                lockedPrice: existing.price_at_booking,
                newPrice: final_price,
            });
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
                details: JSON.stringify({ barber_id, shop_id, context_type, fee_rate: effectiveFeeRate, fixed_fee_waived: effectiveFeeRate === 0 }),
            },
        });

        return { status: 'CALCULATED', booking_id, financial_breakdown, provider_payout, platform_revenue: platform_fee, locked: true };
    }

    if (action === 'calculateRefund') {
        const booking = await prisma.bookings.findUnique({ where: { id: booking_id } });
        if (!booking?.financial_breakdown) {
            return reply.status(400).send({ error: 'Cannot refund: no financial breakdown found' });
        }
        const financial_breakdown = JSON.parse(booking.financial_breakdown);
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
        return { locked: true, breakdown: JSON.parse(booking.financial_breakdown), cannot_modify: true };
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
    const { userId } = request.body as { userId?: string };
    const uid = userId ?? currentUser.id;
    if (uid !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
    try {
        const data = await checkStripeConnectStatusForUser(uid);
        return { data };
    } catch (err: unknown) {
        fastify.log.error(err);
        return reply.status(500).send({ error: err instanceof Error ? err.message : 'Stripe status check failed' });
    }
});

// 6. Initiate Stripe Connect (auth + self only)
fastify.post('/api/functions/initiateStripeConnect', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { userId, returnPath, refreshPath } = request.body as {
        userId?: string;
        returnPath?: string;
        refreshPath?: string;
    };
    const uid = userId ?? currentUser.id;
    if (uid !== currentUser.id) return reply.status(403).send({ error: 'Forbidden' });
    try {
        const data = await initiateStripeConnectForUser(uid, { returnPath, refreshPath });
        return { data };
    } catch (err: unknown) {
        fastify.log.error(err);
        return reply.status(500).send({ error: err instanceof Error ? err.message : 'Stripe Connect onboarding failed' });
    }
});

// 7. Stripe Webhook Handler
fastify.post('/api/webhooks/stripe', async (request, reply) => {
    try {
        const signature = request.headers['stripe-signature'] as string;
        const rawBody = request.rawBody;
        if (!rawBody) {
            return reply.status(400).send({ error: 'Missing raw request body for signature verification' });
        }
        const result = await handleStripeWebhook(rawBody, signature);
        return result;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Webhook error';
        fastify.log.error(e);
        return reply.status(400).send({ error: message });
    }
});

function isPromoNotExpired(expiry_date: string | null | undefined): boolean {
    if (!expiry_date) return true;
    const exp = new Date(expiry_date).getTime();
    return Number.isNaN(exp) || exp >= Date.now();
}

function promoDiscountTextPublic(discount_type: string, discount_value: number): string {
    if (discount_type === 'percentage') return `${discount_value}% off`;
    return `€${discount_value} off`;
}

// 8. Public active promotions (anonymous-friendly)
fastify.get('/api/public/active-promotions', async (request, reply) => {
    try {
        const barberId = (request.query as { barber_id?: string }).barber_id;

        if (barberId) {
            const barber = await prisma.barbers.findUnique({ where: { id: barberId }, select: { shop_id: true } });
            const shopId = barber?.shop_id ?? null;
            const rows = await prisma.promo_codes.findMany({
                where: { is_active: true },
                include: { targets: true },
            });
            return rows
                .filter((r) => isPromoNotExpired(r.expiry_date))
                .filter((r) => resolveAudience(r) !== 'specific_users')
                .filter((r) => promoAppliesToBarberContext(r, barberId, shopId))
                .map((r) => ({
                    id: r.id,
                    code: r.code,
                    shop_id: r.shop_id,
                    discount_type: r.discount_type,
                    discount_value: r.discount_value,
                    type: r.shop_id ? 'shop' : 'general',
                    audience: resolveAudience(r),
                    discount_text: promoDiscountTextPublic(r.discount_type, r.discount_value),
                    title: r.shop_id ? 'Shop offer' : 'Platform offer',
                    description: 'Limited time offer',
                }));
        }

        const allActive = await prisma.promo_codes.findMany({
            where: { is_active: true },
            include: { targets: true },
        });
        const active = allActive.filter((r) => isPromoNotExpired(r.expiry_date));
        const platform = active.filter((p) => {
            const aud = resolveAudience(p);
            return aud === 'everyone' || aud === 'all_barbers' || aud === 'all_shops';
        });
        const shopRows = active.filter((p) => {
            const aud = resolveAudience(p);
            return aud === 'specific_shops' || aud === 'all_shops';
        });
        const shopIds = new Set<string>();
        const hasAllShopsPromo = shopRows.some((row) => resolveAudience(row) === 'all_shops');
        if (hasAllShopsPromo) {
            const shops = await prisma.shops.findMany({ select: { id: true }, take: 500 });
            shops.forEach((s) => shopIds.add(s.id));
        }
        for (const row of shopRows) {
            if (resolveAudience(row) === 'all_shops') continue;
            const ids = row.targets?.filter((t) => t.target_type === 'shop').map((t) => t.target_id) ?? [];
            if (row.shop_id) ids.push(row.shop_id);
            ids.forEach((id) => shopIds.add(id));
        }
        return {
            shop_ids: [...shopIds],
            has_platform_promos: platform.length > 0,
        };
    } catch (e: any) {
        fastify.log.error({ err: e }, 'GET /api/public/active-promotions');
        return reply.status(500).send({ error: e.message || 'Failed to load promotions' });
    }
});

fastify.post('/api/functions/validate-promo-code', async (request, reply) => {
    const ip = request.ip || 'unknown';
    if (!(await isIpRateLimitAllowed('promo', ip, 20, 60_000))) {
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
        const body = (request.body ?? {}) as { days?: number };
        const days = body.days
            ? Math.min(365, Math.max(1, Number(body.days) || 30))
            : 30;
        const result = await getPlatformFinancials({ days });
        return result;
    } catch (e: any) {
        return reply.status(500).send({ error: e.message });
    }
});

// 13. Chat / Conversations, see messageRoutes (/api/messages/*)

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

// Guest booking, no account required (pay-at-shop MVP)
fastify.post('/api/bookings/guest', async (request, reply) => {
    try {
        await rateLimitMiddleware(request, reply);
        if (reply.sent) return;

        const body = request.body as Record<string, unknown>;
        const contactError = validateGuestContact({
            guest_name: typeof body.guest_name === 'string' ? body.guest_name : undefined,
            guest_phone: typeof body.guest_phone === 'string' ? body.guest_phone : undefined,
            guest_email: typeof body.guest_email === 'string' ? body.guest_email : undefined,
        });
        if (contactError) {
            return reply.status(400).send({ error: contactError });
        }

        const paymentMethod = body.payment_method === 'cash_at_store' ? 'cash_at_store' : 'online';
        if (paymentMethod !== 'cash_at_store') {
            return reply.status(400).send({
                error: 'Guest bookings require pay-at-shop. Sign in for online payment and card protection.',
            });
        }

        const guest = normalizeGuestContact({
            guest_name: body.guest_name as string,
            guest_phone: body.guest_phone as string,
            guest_email: body.guest_email as string | undefined,
        });

        const guestAccessToken = crypto.randomUUID();

        const booking = await createBookingLogic({
            ...body,
            client_id: null,
            client_name: guest.guest_name,
            client_phone: guest.guest_phone,
            client_email: guest.guest_email,
            guest_access_token: guestAccessToken,
            payment_method: 'cash_at_store',
        });

        return {
            ...booking,
            guest_access_token: guestAccessToken,
        };
    } catch (e: any) {
        const message = (e && e.message) || 'Guest booking failed';
        fastify.log.warn({ err: e, message }, 'POST /api/bookings/guest error');
        return reply.status(400).send({ error: message });
    }
});

fastify.post('/api/bookings/guest/claim-pending', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const user = request.user as { id: string };
        const body = (request.body as { tokens?: string[] }) ?? {};
        const byTokens = Array.isArray(body.tokens)
            ? await claimGuestBookingsByTokens(user.id, body.tokens)
            : { linked_count: 0, booking_ids: [] as string[] };
        const byContact = await claimPendingGuestBookingsForUser(user.id);
        const bookingIds = [...new Set([...byTokens.booking_ids, ...byContact.booking_ids])];
        return {
            linked_count: bookingIds.length,
            booking_ids: bookingIds,
        };
    } catch (e: any) {
        const message = (e && e.message) || 'Failed to link guest bookings';
        return reply.status(400).send({ error: message });
    }
});

fastify.get('/api/bookings/guest/:token', async (request, reply) => {
    try {
        const { token } = request.params as { token: string };
        if (!token || token.length < 20) {
            return reply.status(400).send({ error: 'Invalid token' });
        }

        const booking = await findGuestBookingByToken(token);
        if (!booking) {
            return reply.status(404).send({ error: 'Booking not found' });
        }

        const serialized = serializeBookingRow(booking);
        return {
            ...serialized,
            barber: booking.barber
                ? {
                      id: booking.barber.id,
                      name: booking.barber.name,
                      image_url: booking.barber.image_url,
                      location: booking.barber.location,
                  }
                : null,
            group_guests: booking.group_guests.map((g) => ({
                id: g.id,
                display_name: g.display_name,
                sort_order: g.sort_order,
            })),
        };
    } catch (e: any) {
        const message = (e && e.message) || 'Failed to load booking';
        return reply.status(500).send({ error: message });
    }
});

fastify.get('/api/bookings/guest/:token/cancel-preview', async (request, reply) => {
    try {
        await rateLimitMiddleware(request, reply);
        if (reply.sent) return;
        const { token } = request.params as { token: string };
        return await getGuestCancellationPreview(token);
    } catch (e: any) {
        const message = (e && e.message) || 'Failed to load cancellation preview';
        const status = /not found/i.test(message) ? 404 : 400;
        return reply.status(status).send({ error: message });
    }
});

fastify.post('/api/bookings/guest/:token/cancel', async (request, reply) => {
    try {
        await rateLimitMiddleware(request, reply);
        if (reply.sent) return;
        const { token } = request.params as { token: string };
        return await cancelGuestBooking(token);
    } catch (e: any) {
        const message = (e && e.message) || 'Failed to cancel booking';
        const status = /not found/i.test(message) ? 404 : 400;
        return reply.status(status).send({ error: message });
    }
});

fastify.post('/api/bookings/guest/:token/claim', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const { token } = request.params as { token: string };
        const user = request.user as { id: string };
        return await claimGuestBookingForUser(token, user.id);
    } catch (e: any) {
        const message = (e && e.message) || 'Failed to link booking';
        const status = /not found/i.test(message) ? 404 : 400;
        return reply.status(status).send({ error: message });
    }
});

fastify.get('/api/bookings/:id/details', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const { id } = request.params as { id: string };
        const booking = await prisma.bookings.findUnique({
            where: { id },
            include: {
                group_guests: { orderBy: { sort_order: 'asc' } },
                barber: { select: { id: true, name: true, user_id: true, offers_mobile_service: true, offers_shop_service: true } },
                client: { select: { id: true, full_name: true, email: true, phone: true } },
            },
        });
        if (!booking) return reply.status(404).send({ error: 'Booking not found' });
        if (!(await rowInScope('booking', booking, request.user as any, request.entityScopeCache))) {
            return reply.status(404).send({ error: 'Not found' });
        }
        const serialized = serializeBookingRow(booking);
        return {
            ...serialized,
            group_guests: booking.group_guests.map((g) => {
                let serviceIds: string[] = [];
                if (g.service_ids) {
                    try {
                        const parsed = JSON.parse(g.service_ids);
                        serviceIds = Array.isArray(parsed) ? parsed : [];
                    } catch {
                        serviceIds = [];
                    }
                }
                return {
                    id: g.id,
                    guest_name: g.guest_name,
                    service_ids: serviceIds,
                    notes: g.notes,
                };
            }),
            barber: booking.barber,
            client: booking.client,
        };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load booking details';
        return reply.status(500).send({ error: message });
    }
});

import { buildRebookPayloadForBooking } from './logic/rebookPayload';
fastify.get('/api/bookings/:id/rebook', { preHandler: [requireAuthPreHandler] }, async (request, reply) => {
    try {
        const { id } = request.params as { id: string };
        const booking = await prisma.bookings.findUnique({ where: { id } });
        if (!booking) return reply.status(404).send({ error: 'Booking not found' });
        if (!(await rowInScope('booking', booking, request.user as any, request.entityScopeCache))) {
            return reply.status(404).send({ error: 'Not found' });
        }
        const payload = await buildRebookPayloadForBooking(id);
        if (!payload) return reply.status(404).send({ error: 'Booking not found' });
        return payload;
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load rebook payload';
        return reply.status(500).send({ error: message });
    }
});

// 14. Reviews (barber + shop)
import { reviewRoutes, reviewCronRoutes } from './reviews/routes';
fastify.register(reviewRoutes);
fastify.register(reviewCronRoutes);

// Generic entity routes (Prisma)
const entities = Object.keys(ENTITY_TABLE);

entities.forEach(entity => {
    const tableName = ENTITY_TABLE[entity];
    const _plural = `/api/${entity}s`.replace(/ys$/, 'ies'); // route path base
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
            const list = Array.isArray(rows) ? rows : [];
            return entity === 'booking' ? serializeBookingRows(list) : list;
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
                {return reply.status(404).send({ error: 'Not found' });}
            return entity === 'booking' ? serializeBookingRow(row as Record<string, unknown>) : row;
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
            const rows = await model().findMany(args);
            return entity === 'booking' ? serializeBookingRows(rows) : rows;
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
            if (blockGenericEntityWrite(entity, reply, request.user as { role?: string } | undefined)) return;
        if (entity === 'loyalty_profile' || entity === 'loyalty_transaction') {
                return reply.status(403).send({ error: LOYALTY_WRITE_MESSAGE });
            }
            if (entity === 'referral') {
                return reply.status(403).send({ error: REFERRAL_WRITE_MESSAGE });
            }
            if (entity === 'wallet_account' || entity === 'wallet_transaction') {
                return reply.status(403).send({ error: WALLET_WRITE_MESSAGE });
            }
            if (entity === 'message') {
                return reply.status(403).send({ error: MESSAGE_WRITE_MESSAGE });
            }
            if (entity === 'review') {
                return reply.status(403).send({ error: 'Use POST /api/reviews to submit a review' });
            }
            if (DEDICATED_API_ENTITIES.has(entity)) {
                return reply.status(403).send({ error: 'Use the dedicated API for this resource' });
            }
            const data = validateEntityBody(request.body, reply);
            if (!data) return;
            if (entity === 'service') {
                try {
                    await enforceServicePriceOnWrite(data);
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : 'Invalid service price';
                    return reply.status(400).send({ error: msg });
                }
            }
            if (entity === 'barber' && typeof data.location === 'string') {
                Object.assign(data, await enrichBarberLocationFields(data));
            }
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
            cleaned.code = (cleaned.code).trim().toUpperCase();
            if (cleaned.discount_type !== 'percentage' && cleaned.discount_type !== 'fixed') {
                return reply.status(400).send({ error: 'discount_type must be percentage or fixed' });
            }
            const dv = Number(cleaned.discount_value);
            if (!Number.isFinite(dv) || dv <= 0) {
                return reply.status(400).send({ error: 'discount_value must be a positive number' });
            }
            cleaned.discount_value = dv;

            try {
                await enforcePromoOnWrite(cleaned);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid promo values';
                return reply.status(400).send({ error: msg });
            }

            const user = request.user as { id: string; role?: string };
            const shopReq = cleaned.shop_id;
            if (user?.role !== 'admin') {
                if (shopReq == null || shopReq === '') {
                    return reply.status(400).send({ error: 'shop_id is required unless you are an admin' });
                }
                const ids = await getManagedShopIdsForUser(user.id, request.entityScopeCache);
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

    // UPDATE, ownership check for AUTH_REQUIRED and AUTH_WRITE entities
    const writeRouteOpts = (requireAuth || AUTH_WRITE_ENTITIES.has(entity)) ? { preHandler: [requireAuthPreHandler] } : {};
    const needsOwnershipCheck = requireAuth || AUTH_WRITE_ENTITIES.has(entity);
    fastify.patch(`${routeBase}/:id`, writeRouteOpts, async (request, reply) => {
        const { id } = request.params as any;
        if (blockGenericEntityWrite(entity, reply, request.user as { role?: string } | undefined)) return;
        if (entity === 'loyalty_profile' || entity === 'loyalty_transaction') {
            return reply.status(403).send({ error: LOYALTY_WRITE_MESSAGE });
        }
        if (entity === 'referral') {
            return reply.status(403).send({ error: REFERRAL_WRITE_MESSAGE });
        }
        if (entity === 'wallet_account' || entity === 'wallet_transaction') {
            return reply.status(403).send({ error: WALLET_WRITE_MESSAGE });
        }
        if (entity === 'message') {
            return reply.status(403).send({ error: MESSAGE_WRITE_MESSAGE });
        }
        if (entity === 'review') {
            return reply.status(403).send({ error: 'Use POST /api/reviews to submit a review' });
        }
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
                {return reply.status(404).send({ error: 'Not found' });}
        }
        if (entity === 'service' && data.price !== undefined) {
            try {
                await enforceServicePriceOnWrite(data);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid service price';
                return reply.status(400).send({ error: msg });
            }
        }
        if (entity === 'promo_code' && (data.discount_type !== undefined || data.discount_value !== undefined)) {
            try {
                await enforcePromoOnWrite(data);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid promo values';
                return reply.status(400).send({ error: msg });
            }
        }
        if (entity === 'barber' && typeof data.location === 'string') {
            Object.assign(data, await enrichBarberLocationFields(data, id));
        }
        if (
            entity === 'barber' &&
            (data.offers_shop_service !== undefined || data.offers_mobile_service !== undefined)
        ) {
            const existingBarber = (needsOwnershipCheck
                ? await model().findUnique({ where: { id } })
                : null) as { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null;
            const nextShop =
                data.offers_shop_service !== undefined
                    ? data.offers_shop_service !== false
                    : offersShopService(existingBarber ?? {});
            const nextMobile =
                data.offers_mobile_service !== undefined
                    ? data.offers_mobile_service === true
                    : offersMobileService(existingBarber ?? {});
            try {
                assertAtLeastOneServiceLocation(nextShop, nextMobile);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid service location settings';
                return reply.status(400).send({
                    error: `${msg}. Use PUT /api/provider/barber/service-locations instead.`,
                });
            }
        }
        if (
            entity === 'shop' &&
            (data.offers_shop_service !== undefined || data.offers_mobile_service !== undefined)
        ) {
            const existingShop = (needsOwnershipCheck
                ? await model().findUnique({ where: { id } })
                : null) as { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null;
            const nextShop =
                data.offers_shop_service !== undefined
                    ? data.offers_shop_service !== false
                    : offersShopService(existingShop ?? {});
            const nextMobile =
                data.offers_mobile_service !== undefined
                    ? data.offers_mobile_service === true
                    : offersMobileService(existingShop ?? {});
            try {
                assertAtLeastOneServiceLocation(nextShop, nextMobile);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid service location settings';
                return reply.status(400).send({
                    error: `${msg}. Use PUT /api/provider/shop/:shopId/service-locations instead.`,
                });
            }
        }
        let bookingExisting: { status?: string | null; client_id?: string | null } | null = null;
        if (entity === 'booking' && data.status !== undefined) {
            bookingExisting = await model().findUnique({
                where: { id },
                select: { status: true, client_id: true, barber_id: true },
            });
        }
        try {
            const updated = await model().update({ where: { id }, data });
            if (
                entity === 'booking' &&
                data.status === 'completed' &&
                bookingExisting?.status !== 'completed' &&
                updated?.id
            ) {
                const { awardPointsForCompletedBooking } = await import('./loyalty/logic');
                await awardPointsForCompletedBooking(String(updated.id));
                const { processReferralOnCompletedBooking } = await import('./referral/logic');
                await processReferralOnCompletedBooking(String(updated.id));
                const { onBookingCompleted } = await import('./domain/hooks/lifecycle');
                await onBookingCompleted(
                    bookingExisting?.client_id ?? updated.client_id ?? null,
                    updated.barber_id ?? null
                );
                const { maybeTriggerReviewRequestOnCompletion } = await import('./reviews/requestLogic');
                await maybeTriggerReviewRequestOnCompletion(
                    String(updated.id),
                    bookingExisting?.status,
                    data.status
                );
            }
            return updated;
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
                return reply.status(404).send({ error: 'Not found' });
            }
            throw e;
        }
    });

    // DELETE, ownership check for AUTH_REQUIRED and AUTH_WRITE entities
    fastify.delete(`${routeBase}/:id`, writeRouteOpts, async (request, reply) => {
        const { id } = request.params as any;
        if (blockGenericEntityWrite(entity, reply, request.user as { role?: string } | undefined)) return;
        if (entity === 'loyalty_profile' || entity === 'loyalty_transaction') {
            return reply.status(403).send({ error: LOYALTY_WRITE_MESSAGE });
        }
        if (entity === 'referral') {
            return reply.status(403).send({ error: REFERRAL_WRITE_MESSAGE });
        }
        if (entity === 'wallet_account' || entity === 'wallet_transaction') {
            return reply.status(403).send({ error: WALLET_WRITE_MESSAGE });
        }
        if (entity === 'message') {
            return reply.status(403).send({ error: MESSAGE_WRITE_MESSAGE });
        }
        if (entity === 'review') {
            return reply.status(403).send({ error: 'Reviews cannot be deleted via entity API' });
        }
        if (needsOwnershipCheck) {
            const existing = await model().findUnique({ where: { id } });
            if (!existing || !(await rowInScope(entity, existing as Record<string, unknown>, request.user as any, request.entityScopeCache)))
                {return reply.status(404).send({ error: 'Not found' });}
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
    if (status >= 500) {
        captureException(err, {
            url: request?.url,
            method: request?.method,
            status,
        });
    }
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
            fastify.log.info('No barbers found, seeding sample data...');
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

        process.on('unhandledRejection', (reason) => {
            fastify.log.error({ reason }, 'UNHANDLED_REJECTION');
            captureException(reason);
        });
        process.on('uncaughtException', (err) => {
            fastify.log.error({ err }, 'UNCAUGHT_EXCEPTION');
            captureException(err);
        });

        void runFixedFeeMaintenance().catch((err) =>
            fastify.log.warn({ err }, 'Fixed-fee maintenance failed on startup')
        );
        setInterval(() => {
            void runFixedFeeMaintenance().catch((err) =>
                fastify.log.warn({ err }, 'Fixed-fee maintenance failed')
            );
        }, 6 * 60 * 60 * 1000);
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
