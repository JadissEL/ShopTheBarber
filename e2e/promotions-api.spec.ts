import { test, expect } from '@playwright/test';
import {
    hasApiBaseUrl,
    hasClerkJwt,
    hasClerkAdminJwt,
    hasClerkProviderJwt,
    clerkAuthHeaders,
} from './fixtures/env';
import { SEED, uniquePromoCode } from './fixtures/seed-data';
import { fetchPriceQuote } from './fixtures/booking-helpers';

/**
 * Promotions lifecycle via REST — provider shop promos + admin audience targeting.
 */
test.describe('Promotions API (provider + admin + public)', () => {
    test('public active promotions include Downtown Cuts shop id', async ({ request }) => {
        test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL');

        const res = await request.get(
            `/api/public/active-promotions?barber_id=${SEED.barber.nikos.id}`
        );
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as {
            shop_ids?: string[];
            promotions?: Array<{ code?: string }>;
        };
        expect(body.shop_ids).toContain(SEED.shop.downtown.id);
        const codes = (body.promotions ?? []).map((p) => p.code);
        expect(codes).toContain(SEED.promo.downtown10);
    });

    test('provider creates shop promo visible in offers', async ({ request }) => {
        test.skip(!hasClerkProviderJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_PROVIDER_JWT');

        const headers = clerkAuthHeaders(process.env.E2E_CLERK_PROVIDER_JWT);
        const code = uniquePromoCode('E2EPROV');

        const createRes = await request.post('/api/promo_codes', {
            headers,
            data: {
                code,
                discount_type: 'percentage',
                discount_value: 15,
                shop_id: SEED.shop.downtown.id,
                is_active: true,
            },
        });
        expect(createRes.ok(), `${createRes.status()} ${await createRes.text()}`).toBeTruthy();
        const created = (await createRes.json()) as { id: string; code: string };
        expect(created.code).toBe(code);

        const offersRes = await request.get(
            `/api/pricing/offers?shop_id=${SEED.shop.downtown.id}&barber_id=${SEED.barber.nikos.id}`
        );
        expect(offersRes.ok()).toBeTruthy();
        const offers = (await offersRes.json()) as { promotions?: Array<{ code?: string }> };
        expect((offers.promotions ?? []).map((p) => p.code)).toContain(code);

        await request.patch(`/api/promo_codes/${created.id}`, {
            headers,
            data: { is_active: false },
        });
    });

    test('admin creates shop-targeted promo and quote validates targeting', async ({ request }) => {
        test.skip(!hasClerkAdminJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_ADMIN_JWT');
        test.skip(!hasClerkJwt(), 'Also set E2E_CLERK_JWT to validate quote as a client');

        const adminHeaders = clerkAuthHeaders(process.env.E2E_CLERK_ADMIN_JWT);
        const clientHeaders = clerkAuthHeaders();
        const code = uniquePromoCode('E2ESHOP');

        const createRes = await request.post('/api/promotions/admin', {
            headers: adminHeaders,
            data: {
                code,
                discount_type: 'percentage',
                discount_value: 20,
                audience: 'specific_shops',
                target_ids: [SEED.shop.downtown.id],
                bypass_policy: true,
                max_uses: 50,
                max_uses_per_user: 5,
                admin_note: 'E2E shop targeting test',
            },
        });
        expect(createRes.ok(), `${createRes.status()} ${await createRes.text()}`).toBeTruthy();
        const promo = (await createRes.json()) as { id: string; code: string };
        expect(promo.code).toBe(code);

        const listRes = await request.get('/api/promotions/admin/list', { headers: adminHeaders });
        expect(listRes.ok()).toBeTruthy();
        const list = (await listRes.json()) as Array<{ code?: string; audience?: string }>;
        expect(list.some((p) => p.code === code && p.audience === 'specific_shops')).toBeTruthy();

        const validQuote = await fetchPriceQuote(request, clientHeaders, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            promoCode: code,
        });
        expect(validQuote.promo?.code).toBe(code);

        await request.post(`/api/promotions/admin/${promo.id}/deactivate`, { headers: adminHeaders });
    });

    test('admin barber-targeted promo rejects wrong barber context', async ({ request }) => {
        test.skip(!hasClerkAdminJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_ADMIN_JWT');
        test.skip(!hasClerkJwt(), 'Also set E2E_CLERK_JWT');

        const adminHeaders = clerkAuthHeaders(process.env.E2E_CLERK_ADMIN_JWT);
        const clientHeaders = clerkAuthHeaders();
        const code = uniquePromoCode('E2EBRB');

        const createRes = await request.post('/api/promotions/admin', {
            headers: adminHeaders,
            data: {
                code,
                discount_type: 'fixed',
                discount_value: 3,
                audience: 'specific_barbers',
                target_ids: [SEED.barber.nikos.id],
                bypass_policy: true,
            },
        });
        expect(createRes.ok(), await createRes.text()).toBeTruthy();
        const promo = (await createRes.json()) as { id: string };

        const okQuote = await fetchPriceQuote(request, clientHeaders, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            promoCode: code,
        });
        expect(okQuote.promo?.code).toBe(code);

        const barbersRes = await request.get('/api/barbers?limit=50');
        expect(barbersRes.ok()).toBeTruthy();
        const barbers = (await barbersRes.json()) as Array<{ id: string; shop_id?: string | null }>;
        const other = barbers.find((b) => b.id !== SEED.barber.nikos.id && b.shop_id && b.shop_id !== SEED.shop.downtown.id);
        test.skip(!other, 'Need a barber outside s1 in seeded DB');

        const badRes = await request.post('/api/pricing/quote', {
            headers: clientHeaders,
            data: {
                barber_id: other!.id,
                shop_id: other!.shop_id,
                service_ids: [SEED.service.signatureCut.id],
                promo_code: code,
                context_type: 'shop',
            },
        });
        expect(badRes.ok()).toBeTruthy();
        const badQuote = (await badRes.json()) as { promo?: unknown };
        expect(badQuote.promo).toBeFalsy();

        await request.post(`/api/promotions/admin/${promo.id}/deactivate`, { headers: adminHeaders });
    });
});
