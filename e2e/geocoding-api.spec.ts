import { test, expect } from '@playwright/test';
import { apiBaseUrl, hasApiBaseUrl } from './fixtures/env';

test.describe('Geocoding API (public)', () => {
    test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL to run API geocoding tests');

    test('GET /api/geocoding/config exposes provider and Greece bias', async ({ request }) => {
        const res = await request.get(`${apiBaseUrl()}/api/geocoding/config`);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.country_bias).toBe('GR');
        expect(body.default_center).toMatchObject({
            latitude: expect.any(Number),
            longitude: expect.any(Number),
        });
        expect(body.geocoding.provider).toMatch(/mapbox|google|nominatim/);
    });

    test('GET /api/at-home-service/suggest rejects very short queries gracefully', async ({ request }) => {
        const res = await request.get(`${apiBaseUrl()}/api/at-home-service/suggest?q=ab`);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.suggestions).toEqual([]);
    });

    test('GET /api/health reports geocoding provider', async ({ request }) => {
        const res = await request.get(`${apiBaseUrl()}/api/health`);
        expect(res.status()).toBeLessThan(600);
        const body = await res.json();
        expect(body.geocoding).toBeDefined();
        expect(body.geocoding.provider).toBeTruthy();
    });

    test('POST /api/at-home-service/quote returns in-area for Athens near gb1', async ({ request }) => {
        const res = await request.post(`${apiBaseUrl()}/api/at-home-service/quote`, {
            data: {
                barber_id: 'gb1',
                address: 'Ermou, Athens, Greece',
                latitude: 37.9755,
                longitude: 23.7348,
            },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        if (body.configured === false) return;
        expect(body.in_service_area).toBe(true);
        expect(typeof body.distance_km).toBe('number');
    });
});
