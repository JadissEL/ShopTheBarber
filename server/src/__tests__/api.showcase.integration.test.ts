/**
 * Provider showcase profile API.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_showcase_${Date.now()}`;
const EMAIL = `showcase-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Showcase Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: provider showcase API', () => {
    let userId: string;
    let barberId: string;
    let careerEntryId: string;
    let portfolioId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (portfolioId) await prisma.barber_videos.deleteMany({ where: { id: portfolioId } });
        if (careerEntryId) {
            await prisma.provider_career_entries.deleteMany({ where: { id: careerEntryId } });
        }
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/showcase/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/showcase/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.career_entry_types?.length).toBeGreaterThan(0);
        expect(body.suggested_highlights?.length).toBeGreaterThan(0);
    });

    it('creates barber, updates showcase, career entry, and portfolio', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const setupRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/mobile-service',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_mobile_service: false },
        });
        expect(setupRes.statusCode).toBe(200);
        barberId = JSON.parse(setupRes.payload).barber_id;

        const barberRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/showcase/barber',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                name: 'Showcase Test Barber',
                title: 'Fade specialist',
                bio: 'Integration test bio',
                years_experience: 8,
                career_started_year: 2016,
                profile_highlights: ['Precision fades', 'Kids welcome'],
            },
        });
        expect(barberRes.statusCode).toBe(200);
        barberId = JSON.parse(barberRes.payload).id;

        const publicRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/showcase`,
        });
        expect(publicRes.statusCode).toBe(200);
        const publicBody = JSON.parse(publicRes.payload);
        expect(publicBody.years_experience).toBe(8);
        expect(publicBody.profile_highlights).toContain('Precision fades');
        expect(publicBody.member_since_label).toBeTruthy();

        const entryRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/provider/career-entries',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                scope: 'barber',
                entry_type: 'education',
                title: 'Barber School Test',
                organization: 'Test Academy',
                started_at: '2014',
                ended_at: '2015',
            },
        });
        expect(entryRes.statusCode).toBe(200);
        careerEntryId = JSON.parse(entryRes.payload).id;

        const portfolioRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/provider/portfolio',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                title: 'Test fade',
                video_url: 'https://example.com/video.jpg',
                thumbnail_url: 'https://example.com/thumb.jpg',
            },
        });
        expect(portfolioRes.statusCode).toBe(200);
        portfolioId = JSON.parse(portfolioRes.payload).id;

        const publicAfterRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/showcase`,
        });
        const publicAfter = JSON.parse(publicAfterRes.payload);
        expect(publicAfter.career_timeline.some((e: { id: string }) => e.id === careerEntryId)).toBe(
            true
        );
        expect(publicAfter.portfolio.some((p: { id: string }) => p.id === portfolioId)).toBe(true);

        const myRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider/showcase',
            headers: authHeaders,
        });
        expect(myRes.statusCode).toBe(200);
        const myBody = JSON.parse(myRes.payload);
        expect(myBody.barber?.portfolio?.length).toBeGreaterThan(0);
    });

    it('GET /api/showcase/discovery-previews returns story snippets', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/showcase/discovery-previews?barber_ids=${barberId}`,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body[barberId]).toBeDefined();
        expect(body[barberId].has_story).toBe(true);
        expect(body[barberId].portfolio_count).toBeGreaterThan(0);
    });

    it('GET /api/provider/showcase/completeness for provider', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider/showcase/completeness',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.barber?.percent).toBeGreaterThan(0);
        expect(body.barber?.items?.length).toBeGreaterThan(0);
    });
});
