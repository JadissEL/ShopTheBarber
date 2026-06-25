import { test, expect } from '@playwright/test';

/**
 * No secrets required — verifies deployed backend responds and DB responds.
 * Set `E2E_API_BASE_URL` (staging or local). GitHub Actions manual workflow wires this automatically.
 */
test.describe('Public API smoke (staging / local)', () => {
    test('GET /api/health returns db ok', async ({ request }) => {
        test.skip(!process.env.E2E_API_BASE_URL, 'Set E2E_API_BASE_URL to your API origin');

        const res = await request.get('/api/health');
        expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
        const body = (await res.json()) as { ok?: unknown; db?: unknown };
        expect(body.ok).toBeTruthy();
        expect(body.db).toBe('ok');
    });

    test('GET /api/public/active-promotions returns JSON', async ({ request }) => {
        test.skip(!process.env.E2E_API_BASE_URL, 'Set E2E_API_BASE_URL to your API origin');

        const res = await request.get('/api/public/active-promotions');
        expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
        const body = (await res.json()) as {
            shop_ids?: unknown;
            has_platform_promos?: unknown;
        };
        expect(Array.isArray(body.shop_ids)).toBeTruthy();
        expect(typeof body.has_platform_promos).toBe('boolean');
    });
});
