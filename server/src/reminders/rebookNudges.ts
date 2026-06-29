import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { logger } from '../lib/logger';
import { buildRebookNudgeSms, sendSms } from '../logic/sms';
import {
    alreadyNudgedSinceLastVisit,
    analyzeClientHabit,
    isDueForRebookNudge,
    type HabitBookingRow,
} from './habitPattern';
import { buildRebookFlowUrl } from './rebookUrl';

const ACTIVE_UPCOMING_STATUSES = ['pending', 'confirmed', 'accepted'];

export type RebookNudgeResult = {
    scanned_clients: number;
    eligible: number;
    sent: number;
    skipped: number;
    failed: number;
    lookback_days: number;
    schema_not_ready?: boolean;
};

type ClientCandidate = {
    id: string;
    phone: string | null;
    full_name: string | null;
    sms_reminders_enabled: boolean | null;
    sms_rebook_nudges_enabled: boolean | null;
    rebook_nudge_sent_at: string | null;
};

function lookbackDays(): number {
    return parseFloat(process.env.REBOOK_NUDGE_LOOKBACK_DAYS || '180') || 180;
}

function lookbackCutoffIso(now: Date): string {
    const ms = now.getTime() - lookbackDays() * 86_400_000;
    return new Date(ms).toISOString();
}

async function clientHasUpcomingBooking(clientId: string, nowIso: string): Promise<boolean> {
    const row = await prisma.bookings.findFirst({
        where: {
            client_id: clientId,
            status: { in: ACTIVE_UPCOMING_STATUSES },
            start_time: { gt: nowIso },
        },
        select: { id: true },
    });
    return !!row;
}

export async function getClientHabitForUser(userId: string, now = new Date()) {
    const cutoff = lookbackCutoffIso(now);
    const bookings = await prisma.bookings.findMany({
        where: {
            client_id: userId,
            status: 'completed',
            start_time: { gte: cutoff },
        },
        orderBy: { start_time: 'desc' },
        take: 30,
        select: {
            id: true,
            start_time: true,
            barber_id: true,
            barber_name: true,
            service_name: true,
            shop_id: true,
            visit_type: true,
            booking_type: true,
            service_snapshot: true,
        },
    });

    const pattern = analyzeClientHabit(userId, bookings);
    if (!pattern) {
        return {
            has_pattern: false as const,
            visits_needed: Math.max(0, 2 - bookings.length),
            completed_visits: bookings.length,
        };
    }

    return {
        has_pattern: true as const,
        visit_count: pattern.visit_count,
        median_interval_days: pattern.median_interval_days,
        preferred_weekday_name: pattern.preferred_weekday_name,
        usual_service_name: pattern.usual_service_name,
        usual_barber_name: pattern.usual_barber_name,
        last_visit_at: pattern.last_visit_at.toISOString(),
        predicted_next_due_at: pattern.predicted_next_due_at.toISOString(),
        due_soon: isDueForRebookNudge(pattern, now),
        rebook_url: buildRebookFlowUrl(pattern.last_booking),
    };
}

export async function processRebookNudges(options?: { now?: Date }): Promise<RebookNudgeResult> {
    const now = options?.now ?? new Date();
    const nowIso = now.toISOString();
    const cutoffIso = lookbackCutoffIso(now);

    let completedRows: Array<HabitBookingRow & { client_id: string | null }>;
    try {
        completedRows = await prisma.bookings.findMany({
            where: {
                status: 'completed',
                client_id: { not: null },
                start_time: { gte: cutoffIso },
            },
            orderBy: { start_time: 'desc' },
            take: 3000,
            select: {
                id: true,
                client_id: true,
                start_time: true,
                barber_id: true,
                barber_name: true,
                service_name: true,
                shop_id: true,
                visit_type: true,
                booking_type: true,
                service_snapshot: true,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
            return {
                scanned_clients: 0,
                eligible: 0,
                sent: 0,
                skipped: 0,
                failed: 0,
                lookback_days: lookbackDays(),
                schema_not_ready: true,
            };
        }
        throw err;
    }

    const byClient = new Map<string, HabitBookingRow[]>();
    for (const row of completedRows) {
        if (!row.client_id) continue;
        const list = byClient.get(row.client_id) ?? [];
        if (list.length >= 30) continue;
        const { client_id: _cid, ...habitRow } = row;
        list.push(habitRow);
        byClient.set(row.client_id, list);
    }

    let eligible = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const [clientId, bookings] of byClient) {
        const pattern = analyzeClientHabit(clientId, bookings);
        if (!pattern || !isDueForRebookNudge(pattern, now)) {
            skipped += 1;
            continue;
        }

        let client: ClientCandidate | null;
        try {
            client = await prisma.users.findUnique({
                where: { id: clientId },
                select: {
                    id: true,
                    phone: true,
                    full_name: true,
                    sms_reminders_enabled: true,
                    sms_rebook_nudges_enabled: true,
                    rebook_nudge_sent_at: true,
                },
            });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
                return {
                    scanned_clients: byClient.size,
                    eligible: 0,
                    sent: 0,
                    skipped: 0,
                    failed: 0,
                    lookback_days: lookbackDays(),
                    schema_not_ready: true,
                };
            }
            throw err;
        }

        if (!client?.phone?.trim()) {
            skipped += 1;
            continue;
        }
        if (client.sms_reminders_enabled === false || client.sms_rebook_nudges_enabled === false) {
            skipped += 1;
            continue;
        }
        if (alreadyNudgedSinceLastVisit(client.rebook_nudge_sent_at, pattern.last_visit_at)) {
            skipped += 1;
            continue;
        }

        if (await clientHasUpcomingBooking(clientId, nowIso)) {
            skipped += 1;
            continue;
        }

        eligible += 1;

        const bookUrl = buildRebookFlowUrl(pattern.last_booking);
        const result = await sendSms(
            client.phone,
            buildRebookNudgeSms({
                clientName: client.full_name,
                barberName: pattern.usual_barber_name,
                serviceName: pattern.usual_service_name,
                preferredDay: pattern.preferred_weekday_name,
                bookUrl,
            })
        );

        if (result.success && !result.mocked && result.sid) {
            await prisma.users.update({
                where: { id: clientId },
                data: {
                    rebook_nudge_sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            });
            sent += 1;
        } else if (result.success && result.mocked) {
            skipped += 1;
        } else {
            failed += 1;
            logger.warn('[rebook-nudges] SMS failed', { clientId, error: result.error });
        }
    }

    return {
        scanned_clients: byClient.size,
        eligible,
        sent,
        skipped,
        failed,
        lookback_days: lookbackDays(),
    };
}
