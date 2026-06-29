import type { Page, APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import { addDays, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { SEED } from './seed-data';

/** Walk through services → datetime → confirmation for a seeded barber at Downtown Cuts. */
export async function completeBookingStepsToConfirmation(
    page: Page,
    options: { serviceName?: string; promoCode?: string } = {}
): Promise<void> {
    const serviceName = options.serviceName ?? SEED.service.signatureCut.name;

    await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({ timeout: 30_000 });

    const serviceCard = page.getByText(serviceName, { exact: true }).first();
    await expect(serviceCard).toBeVisible({ timeout: 45_000 });
    await serviceCard.click();

    await page.getByRole('button', { name: /Continue/i }).click();

    await expect(page.getByRole('heading', { name: /Select Date & Time/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Book ASAP/i }).click();

    await expect(page.getByRole('heading', { name: /Review & Confirm/i })).toBeVisible({ timeout: 30_000 });

    if (options.promoCode) {
        await applyPromoOnConfirmation(page, options.promoCode);
    }
}

export async function applyPromoOnConfirmation(page: Page, code: string): Promise<void> {
    const input = page.getByPlaceholder('Promo Code');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill(code);
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText(new RegExp(`${code} applied`, 'i'))).toBeVisible({ timeout: 20_000 });
}

export async function confirmBookingAndExpectSuccess(page: Page): Promise<void> {
    await page.getByRole('button', { name: /Confirm Booking/i }).click();
    await expect(
        page.getByRole('heading', { name: /Booking (Confirmed|requested)!/i })
    ).toBeVisible({ timeout: 45_000 });
}

/** Guest path on confirmation — fill contact and submit without Clerk. */
export async function fillGuestContactAndConfirm(
    page: Page,
    contact: { name: string; phone: string; email?: string } = {
        name: 'Browser Guest',
        phone: '+33612345678',
    }
): Promise<void> {
    await expect(page.getByText('Book without an account')).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder('First and last name').fill(contact.name);
    await page.getByPlaceholder('+33 6 12 34 56 78').fill(contact.phone);
    if (contact.email) {
        await page.getByPlaceholder('you@email.com').fill(contact.email);
    }
    await page.getByRole('button', { name: /Book without account/i }).click();
    await expect(
        page.getByRole('heading', { name: /Booking requested!/i })
    ).toBeVisible({ timeout: 45_000 });
}

export async function completeGuestBookingToConfirmation(
    page: Page,
    options: { serviceName?: string } = {}
): Promise<void> {
    await completeBookingStepsToConfirmation(page, options);
    await expect(page.getByText('Book without an account')).toBeVisible({ timeout: 20_000 });
}

export function bookingFlowUrl(barberId: string, shopId?: string): string {
    const params = new URLSearchParams({ barberId, step: 'services' });
    if (shopId) params.set('shopId', shopId);
    return `/BookingFlow?${params.toString()}`;
}

export function tomorrowBookingDateText(): string {
    return format(addDays(new Date(), 1), 'PPP', { locale: enUS });
}

export type PriceQuote = {
    sum_price?: number;
    final_price?: number;
    promo?: { code: string; discount_amount: number; discount_text?: string } | null;
};

export async function fetchPriceQuote(
    request: APIRequestContext,
    headers: Record<string, string>,
    opts: {
        barberId: string;
        shopId: string;
        shopMemberId: string;
        serviceIds: string[];
        promoCode?: string;
    }
): Promise<PriceQuote> {
    const res = await request.post('/api/pricing/quote', {
        headers,
        data: {
            barber_id: opts.barberId,
            shop_id: opts.shopId,
            shop_member_id: opts.shopMemberId,
            service_ids: opts.serviceIds,
            promo_code: opts.promoCode ?? null,
            context_type: 'shop',
        },
    });
    expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
    return (await res.json()) as PriceQuote;
}

/** Public pricing quote — no auth (guest booking path). */
export async function fetchPublicPriceQuote(
    request: APIRequestContext,
    opts: {
        barberId: string;
        shopId: string;
        shopMemberId: string;
        serviceIds: string[];
    }
): Promise<PriceQuote> {
    const res = await request.post('/api/pricing/quote', {
        headers: { 'Content-Type': 'application/json' },
        data: {
            barber_id: opts.barberId,
            shop_id: opts.shopId,
            shop_member_id: opts.shopMemberId,
            service_ids: opts.serviceIds,
            context_type: 'shop',
        },
    });
    expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
    return (await res.json()) as PriceQuote;
}

export async function createGuestShopBooking(
    request: APIRequestContext,
    opts: {
        barberId: string;
        shopId: string;
        shopMemberId: string;
        serviceIds: string[];
        finalPrice: number;
        durationMinutes: number;
        timeText?: string;
        guestName?: string;
        guestPhone?: string;
        guestEmail?: string;
    }
): Promise<{ id: string; guest_access_token: string }> {
    const res = await request.post('/api/bookings/guest', {
        headers: { 'Content-Type': 'application/json' },
        data: {
            barber_id: opts.barberId,
            shop_id: opts.shopId,
            shop_member_id: opts.shopMemberId,
            service_ids: opts.serviceIds,
            service_name: SEED.service.signatureCut.name,
            date_text: tomorrowBookingDateText(),
            time_text: opts.timeText ?? '4:00 PM',
            location: SEED.shop.downtown.name,
            visit_type: 'shop',
            context_type: 'shop',
            status: 'pending',
            payment_method: 'cash_at_store',
            price_at_booking: opts.finalPrice,
            duration_at_booking: opts.durationMinutes,
            guest_name: opts.guestName ?? 'Guest Tester',
            guest_phone: opts.guestPhone ?? '+33612345678',
            guest_email: opts.guestEmail,
        },
    });
    expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
    return (await res.json()) as { id: string; guest_access_token: string };
}

export async function createShopBooking(
    request: APIRequestContext,
    headers: Record<string, string>,
    opts: {
        clientId: string;
        barberId: string;
        shopId: string;
        shopMemberId: string;
        serviceIds: string[];
        finalPrice: number;
        durationMinutes: number;
        promoCode?: string;
        timeText?: string;
    }
): Promise<{ id: string; discount_code?: string | null }> {
    const res = await request.post('/api/bookings', {
        headers,
        data: {
            client_id: opts.clientId,
            barber_id: opts.barberId,
            shop_id: opts.shopId,
            shop_member_id: opts.shopMemberId,
            service_ids: opts.serviceIds,
            service_name: SEED.service.signatureCut.name,
            date_text: tomorrowBookingDateText(),
            time_text: opts.timeText ?? '11:30 AM',
            location: SEED.shop.downtown.name,
            visit_type: 'shop',
            context_type: 'shop',
            status: 'pending',
            payment_status: 'unpaid',
            payment_method: 'online',
            price_at_booking: opts.finalPrice,
            duration_at_booking: opts.durationMinutes,
            discount_code: opts.promoCode,
        },
    });
    expect(res.ok(), `${res.status()} ${await res.text()}`).toBeTruthy();
    return (await res.json()) as { id: string; discount_code?: string | null };
}
