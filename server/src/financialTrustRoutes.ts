import crypto from 'crypto';
import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from './auth/requestUser';
import { verifyCronSecret } from './lib/cronAuth';
import {
    getAdminLiveFinancialMetrics,
    getBarberFinancialDashboard,
    getClientDashboardPhase2,
} from './admin/financialTrustMetrics';
import { getNetworkOwnerRollup } from './admin/networkRollup';
import { buildProviderTaxReport, taxReportToCsv } from './exports/taxReport';
import { getClientReputationSummary } from './domain/reputation/applyEvent';
import { syncBarberTrustScore } from './domain/reputation/barberTrust';
import { syncAvailabilityScore, availabilityLabel } from './domain/reputation/availabilityScore';
import {
    getSeasonLeaderboard,
    getHallOfFame,
    refreshChampionshipLeaderboard,
    finalizeSeasonAndHallOfFame,
    finalizeEndedSeasons,
} from './domain/championship/leaderboard';
import { reconcileAllProviderWallets, listRecentWalletReconciliationRuns } from './domain/wallet/reconcile';
import { processAutoRechargeCandidates } from './domain/wallet/autoRecharge';
import { listOpenFraudAlerts, resolveFraudAlert } from './fraud/rules';
import { createGiftCardCheckoutSession } from './giftCards/checkout';
import { redeemGiftCard, listUserGiftCards, getGiftCardBalance } from './giftCards/logic';
import { grantAdCredits, getOrCreateAdCreditWallet, spendAdCredits } from './adCredits/logic';
import { createPartnerApiKey, verifyPartnerApiKey, partnerHasScope, listPartnerApiKeys, revokePartnerApiKey } from './partners/auth';
import { permissionsForRole, isValidShopRole } from './auth/shopRbac';
import { prisma } from './db/prisma';

export async function financialTrustRoutes(fastify: FastifyInstance) {
    // --- Client reputation ---
    fastify.get('/api/me/reputation', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return (await getClientReputationSummary(user.id)) ?? reply.status(404).send({ error: 'Not found' });
    });

    fastify.get('/api/me/dashboard/trust', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return getClientDashboardPhase2(user.id);
    });

    // --- Barber trust scores ---
    fastify.get<{ Params: { barberId: string } }>('/api/barbers/:barberId/trust', async (request) => {
        const { barberId } = request.params;
        const barber = await prisma.barbers.findUnique({
            where: { id: barberId },
            select: { trust_score: true, availability_score: true, name: true },
        });
        if (!barber) return { error: 'Not found' };
        return {
            trust_score: barber.trust_score,
            availability_score: barber.availability_score,
            availability_label: availabilityLabel(barber.availability_score ?? 75),
        };
    });

    fastify.get('/api/provider/financial-dashboard', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const q = request.query as { shop_id?: string };
        return getBarberFinancialDashboard(user.id, q.shop_id ?? null);
    });

    // --- Admin live metrics ---
    fastify.get('/api/admin/financial-trust/live', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        return getAdminLiveFinancialMetrics();
    });

    fastify.get('/api/admin/fraud-alerts', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        return { alerts: await listOpenFraudAlerts() };
    });

    fastify.get('/api/admin/wallet-reconciliation', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const q = request.query as { limit?: string; mismatches_only?: string };
        const runs = await listRecentWalletReconciliationRuns(
            q.limit ? parseInt(q.limit, 10) : 50,
            q.mismatches_only === 'true'
        );
        return { runs };
    });

    fastify.post<{ Params: { id: string } }>('/api/admin/fraud-alerts/:id/resolve', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        await resolveFraudAlert(request.params.id);
        return { ok: true };
    });

    // --- Championships ---
    fastify.get('/api/championships/leaderboard', async (request) => {
        const q = request.query as { season_id?: string; limit?: string };
        return getSeasonLeaderboard(q.season_id, q.limit ? parseInt(q.limit, 10) : 20);
    });

    fastify.get('/api/championships/hall-of-fame', async (request) => {
        const q = request.query as { barber_id?: string };
        return { entries: await getHallOfFame(q.barber_id) };
    });

    // --- Network owner rollup ---
    fastify.get('/api/network/rollup', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        return getNetworkOwnerRollup(user.id);
    });

    // --- Tax export ---
    fastify.get('/api/provider/tax-report', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const q = request.query as { from?: string; to?: string; shop_id?: string; format?: string };
        if (!q.from || !q.to) return reply.status(400).send({ error: 'from and to required (ISO dates)' });
        const report = await buildProviderTaxReport({
            userId: user.id,
            shopId: q.shop_id ?? null,
            from: q.from,
            to: q.to,
        });
        if (q.format === 'csv') {
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', 'attachment; filename="tax-report.csv"');
            return taxReportToCsv(report.rows);
        }
        return report;
    });

    // --- Gift cards ---
    fastify.post('/api/gift-cards/purchase', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const body = request.body as { amount?: number; recipient_email?: string };
        if (!body.amount) return reply.status(400).send({ error: 'amount required' });
        try {
            return await createGiftCardCheckoutSession({
                purchaserId: user.id,
                amount: body.amount,
                recipientEmail: body.recipient_email,
            });
        } catch (e: unknown) {
            return reply.status(400).send({ error: e instanceof Error ? e.message : 'Checkout failed' });
        }
    });

    fastify.post('/api/gift-cards/redeem', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const body = request.body as { code?: string; amount?: number };
        if (!body.code || !body.amount) return reply.status(400).send({ error: 'code and amount required' });
        try {
            return await redeemGiftCard({ code: body.code, userId: user.id, amount: body.amount });
        } catch (e: unknown) {
            return reply.status(400).send({ error: e instanceof Error ? e.message : 'Redeem failed' });
        }
    });

    fastify.get('/api/gift-cards/mine', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return { cards: await listUserGiftCards(user.id) };
    });

    fastify.get<{ Querystring: { code?: string } }>('/api/gift-cards/balance', async (request, reply) => {
        const code = request.query.code;
        if (!code) return reply.status(400).send({ error: 'code required' });
        try {
            return await getGiftCardBalance(code);
        } catch (e: unknown) {
            return reply.status(404).send({ error: e instanceof Error ? e.message : 'Not found' });
        }
    });

    // --- Ad credits ---
    fastify.get('/api/ad-credits/wallet', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return getOrCreateAdCreditWallet(user.id);
    });

    fastify.post('/api/ad-credits/spend', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const body = request.body as { amount?: number; description?: string };
        if (!body.amount || body.amount <= 0) return reply.status(400).send({ error: 'amount required' });
        try {
            return await spendAdCredits({
                userId: user.id,
                amount: body.amount,
                description: body.description ?? 'Ad spend',
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Spend failed';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch('/api/me/wallet/auto-recharge', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        const body = request.body as {
            enabled?: boolean;
            threshold?: number;
            amount?: number;
        };
        const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof body.enabled === 'boolean') data.auto_recharge_enabled = body.enabled;
        if (body.threshold != null && body.threshold >= 0) data.auto_recharge_threshold = body.threshold;
        if (body.amount != null && body.amount >= 10) data.auto_recharge_amount = body.amount;

        const updated = await prisma.users.update({
            where: { id: user.id },
            data,
            select: {
                auto_recharge_enabled: true,
                auto_recharge_threshold: true,
                auto_recharge_amount: true,
            },
        });
        return updated;
    });

    // --- Dispute appeals ---
    fastify.get('/api/me/disputes', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const barber = await prisma.barbers.findFirst({
            where: { user_id: user.id },
            select: { id: true },
        });
        const bookingFilter = barber
            ? { OR: [{ client_id: user.id }, { barber_id: barber.id }] }
            : { client_id: user.id };
        const bookings = await prisma.bookings.findMany({
            where: bookingFilter,
            select: { id: true },
        });
        const bookingIds = bookings.map((b) => b.id);
        if (bookingIds.length === 0) return { disputes: [] };
        const disputes = await prisma.disputes.findMany({
            where: { booking_id: { in: bookingIds } },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
        return { disputes };
    });

    fastify.post('/api/disputes/:disputeId/appeal', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        const { disputeId } = request.params as { disputeId: string };
        const body = request.body as { reason?: string };
        if (!body.reason?.trim()) return reply.status(400).send({ error: 'reason required' });

        const dispute = await prisma.disputes.findUnique({
            where: { id: disputeId },
            include: { booking: { select: { client_id: true, barber_id: true } } },
        });
        if (!dispute) return reply.status(404).send({ error: 'Dispute not found' });

        const barber = dispute.booking?.barber_id
            ? await prisma.barbers.findUnique({
                  where: { id: dispute.booking.barber_id },
                  select: { user_id: true },
              })
            : null;
        const isParty =
            dispute.booking?.client_id === user.id || barber?.user_id === user.id;
        if (!isParty && user.role !== 'admin') {
            return reply.status(403).send({ error: 'Not authorized to appeal this dispute' });
        }

        const appeal = await prisma.dispute_appeals.create({
            data: {
                id: crypto.randomUUID(),
                dispute_id: disputeId,
                appellant_id: user.id,
                reason: body.reason.trim(),
                status: 'pending',
            },
        }).catch(() => null);
        if (!appeal) return reply.status(503).send({ error: 'Appeals not available' });
        return appeal;
    });

    fastify.get('/api/admin/dispute-appeals', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const appeals = await prisma.dispute_appeals.findMany({
            where: { status: 'pending' },
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                appellant: { select: { full_name: true, email: true } },
            },
        }).catch(() => []);
        return { appeals };
    });

    fastify.post('/api/admin/dispute-appeals/:id/resolve', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const { id } = request.params as { id: string };
        const body = request.body as { status?: string };
        const status = body.status === 'rejected' ? 'rejected' : 'accepted';
        await prisma.dispute_appeals.update({
            where: { id },
            data: { status, resolved_at: new Date().toISOString() },
        });
        return { ok: true, status };
    });

    // --- Shop RBAC introspection ---
    fastify.get<{ Params: { shopId: string } }>('/api/shops/:shopId/my-permissions', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (user.role === 'admin') return { role: 'owner', permissions: permissionsForRole('owner') };

        const member = await prisma.shop_members.findFirst({
            where: { shop_id: request.params.shopId, user_id: user.id, status: 'active' },
            select: { role: true },
        });
        if (!member) return reply.status(403).send({ error: 'Not a shop member' });
        const role = isValidShopRole(member.role ?? 'barber') ? member.role! : 'barber';
        return { role, permissions: permissionsForRole(role) };
    });

    // --- Partner API v1 ---
    fastify.get('/api/v1/partner/bookings', async (request, reply) => {
        const key = request.headers['x-api-key'] as string | undefined;
        if (!key) return reply.status(401).send({ error: 'x-api-key required' });
        const partner = await verifyPartnerApiKey(key);
        if (!partner || !partnerHasScope(partner.scopes, 'bookings:read')) {
            return reply.status(403).send({ error: 'Invalid API key, rate limit exceeded, or missing scope' });
        }
        const where: Record<string, unknown> = {};
        if (partner.shop_id) where.shop_id = partner.shop_id;
        if (partner.barber_id) where.barber_id = partner.barber_id;
        const bookings = await prisma.bookings.findMany({
            where,
            take: 50,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                status: true,
                start_time: true,
                service_name: true,
                price_at_booking: true,
                shop_id: true,
                barber_id: true,
            },
        });
        return { partner: partner.name, scope: { shop_id: partner.shop_id ?? null, barber_id: partner.barber_id ?? null }, bookings };
    });

    fastify.post('/api/admin/partner-keys', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const body = request.body as { name?: string; scopes?: string[]; shop_id?: string; barber_id?: string };
        if (!body.name) return reply.status(400).send({ error: 'name required' });
        return createPartnerApiKey(body.name, body.scopes, {
            shop_id: body.shop_id,
            barber_id: body.barber_id,
        });
    });

    fastify.get('/api/admin/partner-keys', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        return { keys: await listPartnerApiKeys() };
    });

    fastify.post<{ Params: { id: string } }>('/api/admin/partner-keys/:id/revoke', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        await revokePartnerApiKey(request.params.id);
        return { ok: true };
    });

    fastify.get('/api/admin/users/search', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const q = (request.query as { q?: string }).q?.trim() ?? '';
        if (q.length < 2) return { users: [] };
        const users = await prisma.users.findMany({
            where: {
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { full_name: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 20,
            select: { id: true, email: true, full_name: true, role: true },
        });
        return { users };
    });

    fastify.get('/api/admin/financing-applications', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const apps = await prisma.financing_applications.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                user: { select: { full_name: true, email: true } },
            },
        }).catch(() => []);
        return { applications: apps };
    });

    fastify.get('/api/me/financing-applications', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const apps = await prisma.financing_applications.findMany({
            where: { user_id: user.id },
            orderBy: { created_at: 'desc' },
            take: 10,
        }).catch(() => []);
        return { applications: apps };
    });

    // --- Financing stub (Phase 3) ---
    fastify.post('/api/financing/apply', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const body = request.body as { amount?: number; purpose?: string };
        if (!body.amount || body.amount <= 0) return reply.status(400).send({ error: 'amount required' });
        const app = await prisma.financing_applications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: user.id,
                amount: body.amount,
                purpose: body.purpose ?? null,
                status: 'pending',
            },
        }).catch(() => null);
        if (!app) return reply.status(503).send({ error: 'Financing not available' });
        return app;
    });

    // --- Crons ---
    fastify.post('/api/cron/championships/refresh', async (request, reply) => {
        if (!verifyCronSecret(request)) return reply.status(401).send({ error: 'Unauthorized' });
        return refreshChampionshipLeaderboard();
    });

    fastify.post('/api/cron/wallets/reconcile', async (request, reply) => {
        if (!verifyCronSecret(request)) return reply.status(401).send({ error: 'Unauthorized' });
        return reconcileAllProviderWallets();
    });

    fastify.post('/api/cron/wallets/auto-recharge-nudge', async (request, reply) => {
        if (!verifyCronSecret(request)) return reply.status(401).send({ error: 'Unauthorized' });
        return processAutoRechargeCandidates();
    });

    fastify.post('/api/cron/championships/finalize-ended', async (request, reply) => {
        if (!verifyCronSecret(request)) return reply.status(401).send({ error: 'Unauthorized' });
        return finalizeEndedSeasons();
    });

    fastify.post<{ Params: { seasonId: string } }>('/api/cron/championships/:seasonId/finalize', async (request, reply) => {
        if (!verifyCronSecret(request)) return reply.status(401).send({ error: 'Unauthorized' });
        return finalizeSeasonAndHallOfFame(request.params.seasonId);
    });

    // Sync barber scores on demand (provider/admin for own barber)
    fastify.post<{ Params: { barberId: string } }>('/api/barbers/:barberId/sync-trust', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (user.role !== 'admin') {
            const barber = await prisma.barbers.findUnique({
                where: { id: request.params.barberId },
                select: { user_id: true },
            });
            if (!barber || barber.user_id !== user.id) {
                return reply.status(403).send({ error: 'Forbidden' });
            }
        }
        const trust = await syncBarberTrustScore(request.params.barberId);
        const availability = await syncAvailabilityScore(request.params.barberId);
        return { trust_score: trust, availability_score: availability };
    });

    fastify.post('/api/admin/ad-credits/grant', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin required' });
        const body = request.body as { user_id?: string; amount?: number; reason?: string };
        if (!body.user_id || !body.amount) return reply.status(400).send({ error: 'user_id and amount required' });
        return grantAdCredits({
            userId: body.user_id,
            amount: body.amount,
            reason: body.reason ?? 'Admin grant',
            actorId: user.id,
        });
    });
}
