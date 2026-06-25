import { test, expect } from '@playwright/test';

/**
 * Validates Clerk Bearer path end-to-end against a running backend (staging or local).
 * Skips in CI/local unless secrets are injected — does not automate Clerk login UI.
 */
const hasClerkTarget = () => !!(process.env.E2E_CLERK_JWT && process.env.E2E_API_BASE_URL);

test.describe('Clerk Bearer → REST (optional)', () => {
    test('GET /api/auth/me returns sovereign user profile', async ({ request }) => {
        test.skip(!hasClerkTarget(), 'Set E2E_CLERK_JWT and E2E_API_BASE_URL (see playwright.config.ts)');

        const res = await request.get('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${process.env.E2E_CLERK_JWT}`,
            },
        });
        expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
        const body = await res.json();
        expect(body).toHaveProperty('id');
        expect(String(body.id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(body).toHaveProperty('email');
    });

    test('POST /api/favorites scoped row (requires seeded barbers)', async ({ request }) => {
        test.skip(!hasClerkTarget(), 'Set E2E_CLERK_JWT and E2E_API_BASE_URL');

        const hdr = {
            Authorization: `Bearer ${process.env.E2E_CLERK_JWT}`,
            'Content-Type': 'application/json',
        };

        const meRes = await request.get('/api/auth/me', { headers: hdr });
        expect(meRes.ok(), await meRes.text()).toBeTruthy();
        const { id: userId } = (await meRes.json()) as { id: string };

        const bars = await request.get('/api/barbers?limit=1');
        expect(bars.ok()).toBeTruthy();
        const barbers = (await bars.json()) as Array<{ id: string }>;
        test.skip(!Array.isArray(barbers) || barbers.length === 0, 'No barbers in DB — seed the server');

        const targetId = barbers[0].id;
        const favRes = await request.post('/api/favorites', {
            headers: hdr,
            data: JSON.stringify({
                user_id: userId,
                target_id: targetId,
                target_type: 'barber',
            }),
        });

        expect(favRes.ok(), `${favRes.status()} ${await favRes.text()}`).toBeTruthy();
        const fav = (await favRes.json()) as { id?: string };

        if (fav?.id) {
            await request.delete(`/api/favorites/${fav.id}`, { headers: hdr });
        }
    });
});
