import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { TOMBOLA_CONFIG, type DrawStatus } from './config';
import {
    evaluateUserEligibility,
    freeEntryEligibility,
    type EligibilityBreakdown,
} from './eligibility';
import { publishTombola } from './events';

function nowIso(): string {
    return new Date().toISOString();
}

/** Monday 00:00 UTC of the week containing `date`. */
export function getWeekBounds(date = new Date()): { weekStart: string; weekEnd: string; drawAt: string } {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const draw = new Date(sunday);
    draw.setUTCHours(TOMBOLA_CONFIG.draw.drawHourUtc, 0, 0, 0);

    return {
        weekStart: monday.toISOString(),
        weekEnd: sunday.toISOString(),
        drawAt: draw.toISOString(),
    };
}

function serializeDraw(row: {
    id: string;
    title: string;
    prize_title: string;
    prize_description: string | null;
    week_start: string;
    week_end: string;
    draw_at: string;
    status: string | null;
    winner_user_id: string | null;
    winner_display_name: string | null;
    total_tickets: number | null;
    participant_count: number | null;
    draw_hash: string | null;
    skill_question: string | null;
    completed_at: string | null;
}) {
    return {
        id: row.id,
        title: row.title,
        prize_title: row.prize_title,
        prize_description: row.prize_description,
        week_start: row.week_start,
        week_end: row.week_end,
        draw_at: row.draw_at,
        status: row.status ?? 'open',
        winner_user_id: row.winner_user_id,
        winner_display_name: row.winner_display_name,
        total_tickets: row.total_tickets ?? 0,
        participant_count: row.participant_count ?? 0,
        draw_hash: row.draw_hash,
        skill_question: row.skill_question,
        completed_at: row.completed_at,
        countdown_seconds: TOMBOLA_CONFIG.draw.countdownSeconds,
        rules: {
            skill_required: true,
            free_entry_available: true,
            min_age: 18,
            eligible_roles: ['client', 'barber'],
        },
    };
}

export async function ensureCurrentWeekDraw() {
    const { weekStart, weekEnd, drawAt } = getWeekBounds();
    let draw = await prisma.weekly_draws.findFirst({
        where: { week_start: weekStart },
    });
    if (!draw) {
        const ts = nowIso();
        draw = await prisma.weekly_draws.create({
            data: {
                id: crypto.randomUUID(),
                title: 'Weekly Trip Tombola',
                prize_title: TOMBOLA_CONFIG.prize.title,
                prize_description: TOMBOLA_CONFIG.prize.description,
                week_start: weekStart,
                week_end: weekEnd,
                draw_at: drawAt,
                status: 'open',
                skill_question: TOMBOLA_CONFIG.skillQuestion,
                skill_answer: TOMBOLA_CONFIG.skillAnswer,
                created_at: ts,
                updated_at: ts,
            },
        });
    }
    return draw;
}

async function refreshDrawTotals(drawId: string) {
    const agg = await prisma.draw_entries.aggregate({
        where: { draw_id: drawId },
        _sum: { entry_count: true },
        _count: { id: true },
    });
    await prisma.weekly_draws.update({
        where: { id: drawId },
        data: {
            total_tickets: agg._sum.entry_count ?? 0,
            participant_count: agg._count.id ?? 0,
            updated_at: nowIso(),
        },
    });
}

export async function syncUserEntry(
    userId: string,
    opts?: { freeEntry?: boolean; preferRole?: 'client' | 'barber' }
) {
    const draw = await ensureCurrentWeekDraw();
    if (draw.status === 'completed' || draw.status === 'locked') {
        const existing = await prisma.draw_entries.findUnique({
            where: { draw_id_user_id: { draw_id: draw.id, user_id: userId } },
        });
        return { draw, entry: existing, eligibility: null as EligibilityBreakdown | null };
    }

    let eligibility: EligibilityBreakdown;
    let isFree = false;

    if (opts?.freeEntry) {
        eligibility = freeEntryEligibility();
        isFree = true;
    } else {
        const evalResult = await evaluateUserEligibility(
            userId,
            draw.week_start,
            draw.week_end,
            opts?.preferRole
        );
        eligibility = evalResult;
        if (!evalResult.eligible || evalResult.entry_count < 1) {
            return { draw, entry: null, eligibility: evalResult };
        }
    }

    const ts = nowIso();
    const entry = await prisma.draw_entries.upsert({
        where: { draw_id_user_id: { draw_id: draw.id, user_id: userId } },
        create: {
            id: crypto.randomUUID(),
            draw_id: draw.id,
            user_id: userId,
            participant_role: eligibility.role ?? 'client',
            entry_count: eligibility.entry_count,
            eligibility_json: JSON.stringify(eligibility.breakdown),
            is_free_entry: isFree,
            created_at: ts,
            updated_at: ts,
        },
        update: {
            participant_role: eligibility.role ?? 'client',
            entry_count: isFree
                ? Math.max(eligibility.entry_count, 1)
                : eligibility.entry_count,
            eligibility_json: JSON.stringify(eligibility.breakdown),
            is_free_entry: isFree ? true : undefined,
            updated_at: ts,
        },
    });

    await refreshDrawTotals(draw.id);
    publishTombola({ type: 'state', draw_id: draw.id });
    return { draw, entry, eligibility };
}

export async function syncAllEntries(drawId: string) {
    const draw = await prisma.weekly_draws.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error('Draw not found');

    const users = await prisma.users.findMany({
        where: {
            role: { in: ['client', 'barber', 'provider', 'shop_owner'] },
            clerk_user_id: { not: null },
        },
        select: { id: true },
        take: 5000,
    });

    let synced = 0;
    for (const u of users) {
        const result = await syncUserEntry(u.id);
        if (result.entry) synced += 1;
    }
    await refreshDrawTotals(drawId);
    return { synced, total_participants: draw.participant_count };
}

export async function advanceDrawState(drawId: string) {
    const draw = await prisma.weekly_draws.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error('Draw not found');
    const now = Date.now();
    const drawAt = new Date(draw.draw_at).getTime();

    if (draw.status === 'completed') return draw;

    if (now >= drawAt - 5 * 60 * 1000 && draw.status === 'open') {
        await syncAllEntries(drawId);
        const updated = await prisma.weekly_draws.update({
            where: { id: drawId },
            data: { status: 'locked', updated_at: nowIso() },
        });
        publishTombola({ type: 'state', draw_id: drawId });
        return updated;
    }

    if (now >= drawAt && (draw.status === 'locked' || draw.status === 'open')) {
        const updated = await prisma.weekly_draws.update({
            where: { id: drawId },
            data: { status: 'live', updated_at: nowIso() },
        });
        publishTombola({ type: 'state', draw_id: drawId });
        publishTombola({
            type: 'countdown',
            draw_id: drawId,
            seconds_left: TOMBOLA_CONFIG.draw.countdownSeconds,
        });
        return updated;
    }

    if (
        draw.status === 'live' &&
        !draw.winner_user_id &&
        now >= drawAt + TOMBOLA_CONFIG.draw.countdownSeconds * 1000
    ) {
        return runDraw(drawId);
    }

    return draw;
}

export async function runDraw(drawId: string) {
    const draw = await prisma.weekly_draws.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error('Draw not found');
    if (draw.winner_user_id) return draw;

    const entries = await prisma.draw_entries.findMany({
        where: { draw_id: drawId, entry_count: { gt: 0 } },
        include: { user: { select: { id: true, full_name: true, role: true } } },
    });

    const eligible = entries.filter((e) => e.user?.role !== 'admin');
    const totalTickets = eligible.reduce((s, e) => s + (e.entry_count ?? 0), 0);

    if (totalTickets < 1) {
        const updated = await prisma.weekly_draws.update({
            where: { id: drawId },
            data: {
                status: 'completed',
                completed_at: nowIso(),
                updated_at: nowIso(),
                winner_display_name: 'No eligible entries',
            },
        });
        publishTombola({ type: 'state', draw_id: drawId });
        return updated;
    }

    const seed = crypto.randomBytes(32).toString('hex');
    const pick = crypto.randomInt(1, totalTickets + 1);
    let cumulative = 0;
    let winnerEntry = eligible[0];
    for (const e of eligible) {
        cumulative += e.entry_count ?? 0;
        if (pick <= cumulative) {
            winnerEntry = e;
            break;
        }
    }

    const hash = crypto
        .createHash('sha256')
        .update(`${seed}:${pick}:${totalTickets}:${winnerEntry.user_id}`)
        .digest('hex');

    const winnerName = winnerEntry.user?.full_name ?? 'Winner';
    const ts = nowIso();

    const updated = await prisma.weekly_draws.update({
        where: { id: drawId },
        data: {
            status: 'completed',
            winner_user_id: winnerEntry.user_id,
            winner_display_name: winnerName,
            draw_seed: seed,
            draw_hash: hash,
            total_tickets: totalTickets,
            participant_count: eligible.length,
            completed_at: ts,
            updated_at: ts,
        },
    });

    await prisma.draw_winner_claims.create({
        data: {
            id: crypto.randomUUID(),
            draw_id: drawId,
            user_id: winnerEntry.user_id,
            status: 'pending',
            created_at: ts,
        },
    });

    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: winnerEntry.user_id,
            title: 'You won the Weekly Tombola!',
            content: `Congratulations! You won ${draw.prize_title}. Complete the skill question to claim your prize.`,
            type: 'tombola_winner',
            is_read: false,
        },
    });

    publishTombola({
        type: 'winner',
        draw_id: drawId,
        winner_user_id: winnerEntry.user_id,
        winner_display_name: winnerName,
    });
    publishTombola({ type: 'state', draw_id: drawId });

    return updated;
}

export async function getCurrentDrawPublic() {
    const draw = await ensureCurrentWeekDraw();
    const advanced = await advanceDrawState(draw.id);
    const serialized = serializeDraw(advanced);

    const now = Date.now();
    const drawAt = new Date(advanced.draw_at).getTime();
    const phase: DrawStatus = (advanced.status as DrawStatus) ?? 'open';
    const seconds_until_draw = Math.max(0, Math.floor((drawAt - now) / 1000));
    let seconds_until_winner = 0;

    if (phase === 'live' && !advanced.winner_user_id) {
        const elapsed = Math.floor((now - drawAt) / 1000);
        seconds_until_winner = Math.max(0, TOMBOLA_CONFIG.draw.countdownSeconds - elapsed);
    }

    const recentWinners = await prisma.weekly_draws.findMany({
        where: { status: 'completed', winner_user_id: { not: null } },
        orderBy: { completed_at: 'desc' },
        take: 5,
        select: {
            id: true,
            prize_title: true,
            winner_display_name: true,
            completed_at: true,
            draw_hash: true,
        },
    });

    return {
        draw: serialized,
        phase,
        seconds_until_draw,
        seconds_until_winner,
        recent_winners: recentWinners,
        config: {
            client: TOMBOLA_CONFIG.client,
            barber: TOMBOLA_CONFIG.barber,
            prize: TOMBOLA_CONFIG.prize,
        },
    };
}

export async function getMyTombolaStatus(userId: string, preferRole?: 'client' | 'barber') {
    const draw = await ensureCurrentWeekDraw();
    await advanceDrawState(draw.id);

    const entry = await prisma.draw_entries.findUnique({
        where: { draw_id_user_id: { draw_id: draw.id, user_id: userId } },
    });

    const eligibility = await evaluateUserEligibility(
        userId,
        draw.week_start,
        draw.week_end,
        preferRole
    );

    const claim = await prisma.draw_winner_claims.findFirst({
        where: { draw_id: draw.id, user_id: userId },
    });

    const isWinner = draw.winner_user_id === userId;

    return {
        draw_id: draw.id,
        entry: entry
            ? {
                  entry_count: entry.entry_count,
                  participant_role: entry.participant_role,
                  is_free_entry: entry.is_free_entry,
              }
            : null,
        eligibility,
        is_winner: isWinner,
        claim: claim
            ? {
                  status: claim.status,
                  skill_passed: claim.skill_passed,
              }
            : null,
        skill_question: isWinner ? draw.skill_question : null,
    };
}

export async function claimFreeEntry(userId: string) {
    return syncUserEntry(userId, { freeEntry: true });
}

export async function submitSkillAnswer(userId: string, drawId: string, answer: string) {
    const draw = await prisma.weekly_draws.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error('Draw not found');
    if (draw.winner_user_id !== userId) throw new Error('Only the winner can claim this prize');

    const normalized = answer.trim();
    const expected = (draw.skill_answer ?? TOMBOLA_CONFIG.skillAnswer).trim();
    const passed = normalized === expected;

    const claim = await prisma.draw_winner_claims.upsert({
        where: { draw_id: drawId },
        create: {
            id: crypto.randomUUID(),
            draw_id: drawId,
            user_id: userId,
            skill_answer: normalized,
            skill_passed: passed,
            status: passed ? 'verified' : 'pending',
            claimed_at: nowIso(),
        },
        update: {
            skill_answer: normalized,
            skill_passed: passed,
            status: passed ? 'verified' : 'pending',
            claimed_at: nowIso(),
        },
    });

    if (!passed) throw new Error('Incorrect answer. Try again without assistance.');

    return { claim, message: 'Prize claim verified! Our team will contact you within 48 hours to arrange your trip for two.' };
}

export async function listAdminDraws() {
    return prisma.weekly_draws.findMany({
        orderBy: { week_start: 'desc' },
        take: 20,
    });
}

export async function adminForceRunDraw(drawId: string) {
    const draw = await prisma.weekly_draws.findUnique({ where: { id: drawId } });
    if (!draw) throw new Error('Draw not found');
    await syncAllEntries(drawId);
    await prisma.weekly_draws.update({
        where: { id: drawId },
        data: { status: 'live', updated_at: nowIso() },
    });
    return runDraw(drawId);
}
