import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';
import { REPUTATION_EVENT_DELTAS } from './events';
import { levelFromScore } from './levels';

export async function applyReputationEvent(params: {
    userId: string;
    eventType: string;
    payload?: Record<string, unknown>;
    pointsOverride?: number;
    reliabilityOverride?: number;
}) {
    try {
        const config = REPUTATION_EVENT_DELTAS[params.eventType];
        const pointsDelta = params.pointsOverride ?? config?.points ?? 0;
        const reliabilityDelta = params.reliabilityOverride ?? config?.reliability ?? 0;

        const user = await prisma.users.findUnique({
            where: { id: params.userId },
            select: { reputation_score: true, reliability_index: true },
        });
        if (!user) return null;

        const newScore = Math.max(0, (user.reputation_score ?? 0) + pointsDelta);
        const newReliability = Math.max(0, Math.min(100, (user.reliability_index ?? 100) + reliabilityDelta));
        const newLevel = levelFromScore(newScore);
        const now = new Date().toISOString();

        await prisma.$transaction([
            prisma.reputation_events.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: params.userId,
                    event_type: params.eventType,
                    points_delta: pointsDelta,
                    reliability_delta: reliabilityDelta,
                    payload_json: params.payload ? JSON.stringify(params.payload) : null,
                },
            }),
            prisma.users.update({
                where: { id: params.userId },
                data: {
                    reputation_score: newScore,
                    reputation_level: newLevel,
                    reliability_index: newReliability,
                    reputation_updated_at: now,
                    updated_at: now,
                },
            }),
        ]);

        return { score: newScore, level: newLevel, reliability_index: newReliability };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return null;
        throw err;
    }
}

export async function getClientReputationSummary(userId: string) {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
            reputation_score: true,
            reputation_level: true,
            reliability_index: true,
            reputation_updated_at: true,
        },
    });
    if (!user) return null;

    const recentEvents = await prisma.reputation_events.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: {
            event_type: true,
            points_delta: true,
            reliability_delta: true,
            created_at: true,
        },
    }).catch(() => []);

    return {
        score: user.reputation_score ?? 0,
        level: user.reputation_level ?? 'new',
        reliability_index: user.reliability_index ?? 100,
        updated_at: user.reputation_updated_at,
        recent_events: recentEvents,
    };
}
