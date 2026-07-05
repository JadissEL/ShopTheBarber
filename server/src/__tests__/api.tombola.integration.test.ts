/**
 * Smoke: weekly tombola API.
 */
import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_tombola_${Date.now()}`;
const EMAIL = `tombola-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Tombola Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { getWeekBounds } from '../tombola/logic';
import { TOMBOLA_CONFIG } from '../tombola/config';
import crypto from 'crypto';

/** Keep the current-week draw open so tests are not flaky near Sunday 20:00 UTC. */
async function resetCurrentDrawForTests() {
    const { weekStart, weekEnd } = getWeekBounds();
    const futureDrawAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const ts = new Date().toISOString();

    const existing = await prisma.weekly_draws.findFirst({ where: { week_start: weekStart } });
    if (existing) {
        await prisma.draw_winner_claims.deleteMany({ where: { draw_id: existing.id } });
        await prisma.draw_entries.deleteMany({ where: { draw_id: existing.id } });
        await prisma.weekly_draws.update({
            where: { id: existing.id },
            data: {
                status: 'open',
                draw_at: futureDrawAt,
                week_end: weekEnd,
                winner_user_id: null,
                winner_display_name: null,
                completed_at: null,
                draw_seed: null,
                draw_hash: null,
                total_tickets: 0,
                participant_count: 0,
                updated_at: ts,
            },
        });
        return;
    }

    await prisma.weekly_draws.create({
        data: {
            id: crypto.randomUUID(),
            title: 'Weekly Trip Tombola',
            prize_title: TOMBOLA_CONFIG.prize.title,
            prize_description: TOMBOLA_CONFIG.prize.description,
            week_start: weekStart,
            week_end: weekEnd,
            draw_at: futureDrawAt,
            status: 'open',
            skill_question: TOMBOLA_CONFIG.skillQuestion,
            skill_answer: TOMBOLA_CONFIG.skillAnswer,
            created_at: ts,
            updated_at: ts,
        },
    });
}

describe('integration: tombola API', () => {
    let userId: string;
    let drawId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    beforeEach(async () => {
        await resetCurrentDrawForTests();
    });

    afterAll(async () => {
        if (drawId) {
            await prisma.draw_winner_claims.deleteMany({ where: { draw_id: drawId } });
            await prisma.draw_entries.deleteMany({ where: { draw_id: drawId } });
            await prisma.weekly_draws.deleteMany({ where: { id: drawId } });
        }
        if (userId) {
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.draw_entries.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/tombola/current is public', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/tombola/current' });
        expect(res.statusCode, res.payload).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.draw?.prize_title).toBeTruthy();
        expect(body.draw?.status).toBe('open');
        drawId = body.draw.id;
    }, 60_000);

    it('GET /api/tombola/me requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/tombola/me' });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/tombola/free-entry registers alternate entry', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/tombola/free-entry',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {},
        });
        expect(res.statusCode, res.payload).toBe(200);
        const body = JSON.parse(res.payload);
        const tickets = body.entry?.entry_count ?? body.eligibility?.entry_count ?? 0;
        expect(tickets).toBeGreaterThan(0);
        expect(body.entry?.is_free_entry).toBe(true);
        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        if (body.draw?.id) drawId = body.draw.id;
    });

    it('GET /api/tombola/admin/draws forbidden for client', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/tombola/admin/draws',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });
});
