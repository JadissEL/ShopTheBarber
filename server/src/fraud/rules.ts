import crypto from 'crypto';
import { prisma } from '../db/prisma';

export type FraudRuleId =
    | 'rapid_booking_burst'
    | 'multiple_no_shows'
    | 'duplicate_payment_pattern'
    | 'negative_wallet_abuse';

export async function createFraudAlert(params: {
    entityType: string;
    entityId: string;
    ruleId: FraudRuleId;
    severity?: 'low' | 'medium' | 'high';
    payload?: Record<string, unknown>;
}) {
    return prisma.fraud_alerts.create({
        data: {
            id: crypto.randomUUID(),
            entity_type: params.entityType,
            entity_id: params.entityId,
            rule_id: params.ruleId,
            severity: params.severity ?? 'medium',
            payload_json: params.payload ? JSON.stringify(params.payload) : null,
            status: 'open',
        },
    }).catch(() => null);
}

export async function runFraudRulesForUser(userId: string) {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const recentBookings = await prisma.bookings.count({
        where: { client_id: userId, created_at: { gte: since } },
    });

    const alerts: FraudRuleId[] = [];
    if (recentBookings >= 8) {
        await createFraudAlert({
            entityType: 'user',
            entityId: userId,
            ruleId: 'rapid_booking_burst',
            severity: 'high',
            payload: { count_24h: recentBookings },
        });
        alerts.push('rapid_booking_burst');
    }

    const noShows = await prisma.bookings.count({
        where: { client_id: userId, status: 'no_show' },
    });
    if (noShows >= 3) {
        await createFraudAlert({
            entityType: 'user',
            entityId: userId,
            ruleId: 'multiple_no_shows',
            severity: 'medium',
            payload: { no_show_count: noShows },
        });
        alerts.push('multiple_no_shows');
    }

    return { user_id: userId, alerts_triggered: alerts };
}

export async function runFraudRulesForProvider(userId: string) {
    const alerts: FraudRuleId[] = [];
    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true },
    });
    if (!barber) return { user_id: userId, alerts_triggered: alerts };

    const wallet = await prisma.provider_fee_wallets.findFirst({
        where: { barber_id: barber.id },
        select: { id: true, balance: true },
    });
    if (wallet && (wallet.balance ?? 0) < -15) {
        await createFraudAlert({
            entityType: 'user',
            entityId: userId,
            ruleId: 'negative_wallet_abuse',
            severity: 'high',
            payload: { wallet_id: wallet.id, balance: wallet.balance },
        });
        alerts.push('negative_wallet_abuse');
    }

    const since = new Date(Date.now() - 48 * 3600000).toISOString();
    const dupClients = await prisma.bookings.groupBy({
        by: ['client_id'],
        where: {
            barber_id: barber.id,
            created_at: { gte: since },
            authorization_status: 'authorized',
        },
        _count: { id: true },
        having: { id: { _count: { gte: 5 } } },
    }).catch(() => []);

    if (dupClients.length > 0) {
        await createFraudAlert({
            entityType: 'user',
            entityId: userId,
            ruleId: 'duplicate_payment_pattern',
            severity: 'medium',
            payload: { suspicious_client_count: dupClients.length },
        });
        alerts.push('duplicate_payment_pattern');
    }

    return { user_id: userId, alerts_triggered: alerts };
}

export async function runAllFraudRulesForUser(userId: string) {
    const client = await runFraudRulesForUser(userId);
    const provider = await runFraudRulesForProvider(userId);
    return {
        user_id: userId,
        alerts_triggered: [...new Set([...client.alerts_triggered, ...provider.alerts_triggered])],
    };
}

export async function listOpenFraudAlerts(limit = 50) {
    return prisma.fraud_alerts.findMany({
        where: { status: 'open' },
        orderBy: { created_at: 'desc' },
        take: limit,
    }).catch(() => []);
}

export async function resolveFraudAlert(alertId: string) {
    return prisma.fraud_alerts.update({
        where: { id: alertId },
        data: { status: 'resolved', resolved_at: new Date().toISOString() },
    });
}
