/**

 * Group booking settings and quotes — available to all barbers and shop owners.

 */

import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';

import type { FastifyInstance } from 'fastify';



const CLERK_ID = `clerk_gb_${Date.now()}`;

const EMAIL = `gb-int-${Date.now()}@example.com`;



vi.mock('../auth/clerk', () => ({

    verifyClerkToken: vi.fn(async () => ({

        id: CLERK_ID,

        email: EMAIL,

        role: 'barber',

        full_name: 'Group Barber',

        avatar_url: null,

    })),

}));



import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

async function deleteBookingCascade(bookingId: string) {
    await prisma.group_booking_guests.deleteMany({ where: { booking_id: bookingId } });
    await prisma.booking_services.deleteMany({ where: { booking_id: bookingId } });
    await prisma.bookings.delete({ where: { id: bookingId } });
}



describe('integration: group booking API', () => {

    let userId: string;

    let barberId: string;

    let serviceId: string;

    const authHeaders = { authorization: 'Bearer test-token' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'solo_barber',
            fullName: 'Group Barber',
        });
    });

    afterAll(async () => {

        if (barberId) {

            await prisma.group_booking_guests.deleteMany({

                where: { booking: { barber_id: barberId } },

            });

            await prisma.booking_services.deleteMany({ where: { booking: { barber_id: barberId } } });

            await prisma.bookings.deleteMany({ where: { barber_id: barberId } });

            await prisma.shifts.deleteMany({ where: { barber_id: barberId } });

            await prisma.barbers.deleteMany({ where: { id: barberId } });

        }

        if (serviceId) await prisma.services.deleteMany({ where: { id: serviceId } });

        if (userId) {
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }

        await (app as FastifyInstance).close();

    });



    it('GET /api/group-booking/config is public', async () => {

        const res = await (app as FastifyInstance).inject({

            method: 'GET',

            url: '/api/group-booking/config',

        });

        expect(res.statusCode).toBe(200);

        expect(JSON.parse(res.payload).label).toBe('Group booking');

    });



    it('any barber enables group booking, quote, and public listing without VIP', async () => {

        const meRes = await (app as FastifyInstance).inject({

            method: 'GET',

            url: '/api/auth/me',

            headers: authHeaders,

        });

        expect(meRes.statusCode).toBe(200);

        userId = JSON.parse(meRes.payload).id;



        const enableRes = await (app as FastifyInstance).inject({

            method: 'PUT',

            url: '/api/provider/barber/group-booking',

            headers: { ...authHeaders, 'content-type': 'application/json' },

            payload: {

                offers_group_booking: true,

                group_booking_min_party: 2,

                group_booking_max_party: 6,

                group_booking_discount_percent: 10,

            },

        });

        expect(enableRes.statusCode).toBe(200);

        expect(JSON.parse(enableRes.payload).offers_group_booking).toBe(true);



        const barber = await prisma.barbers.findFirst({ where: { user_id: userId } });

        expect(barber).toBeTruthy();

        barberId = barber!.id;



        serviceId = `svc-gb-${Date.now()}`;

        await prisma.services.create({

            data: {

                id: serviceId,

                barber_id: barberId,

                name: 'Group Haircut',

                category: 'Hair',

                price: 30,

                duration_minutes: 30,

            },

        });



        const quoteRes = await (app as FastifyInstance).inject({

            method: 'POST',

            url: '/api/group-booking/quote',

            headers: { ...authHeaders, 'content-type': 'application/json' },

            payload: {

                barber_id: barberId,

                service_ids: [serviceId],

                guests: [{ guest_name: 'Alex' }, { guest_name: 'Jordan' }],

                context_type: 'independent',

            },

        });

        expect(quoteRes.statusCode).toBe(200);

        const quote = JSON.parse(quoteRes.payload);

        expect(quote.party_size).toBe(2);

        expect(quote.group_subtotal).toBe(60);

        expect(quote.group_discount_amount).toBe(6);

        expect(quote.final_price).toBe(54);



        const getRes = await (app as FastifyInstance).inject({

            method: 'GET',

            url: `/api/barbers/${barberId}/group-booking`,

        });

        expect(getRes.statusCode).toBe(200);

        expect(JSON.parse(getRes.payload).offers_group_booking).toBe(true);



        const listRes = await (app as FastifyInstance).inject({

            method: 'GET',

            url: '/api/public/group-booking-barbers',

        });

        expect(listRes.statusCode).toBe(200);

        expect(JSON.parse(listRes.payload).barbers.some((b: { id: string }) => b.id === barberId)).toBe(

            true

        );



        const homeRes = await (app as FastifyInstance).inject({

            method: 'GET',

            url: '/api/public/home',

        });

        expect(homeRes.statusCode).toBe(200);

        const home = JSON.parse(homeRes.payload);

        expect(home.vip_group_barbers.some((b: { id: string }) => b.id === barberId)).toBe(true);

        const { addDays, format } = await import('date-fns');
        const { enUS } = await import('date-fns/locale');
        const bookingDay = addDays(new Date(), 21);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
        const shiftDay = dayNames[bookingDay.getDay()];
        const shiftId = `shift-gb-${Date.now()}`;
        await prisma.shifts.create({
            data: {
                id: shiftId,
                barber_id: barberId,
                day: shiftDay,
                start_time: '09:00',
                end_time: '18:00',
            },
        });

        const dateText = format(bookingDay, 'PPP', { locale: enUS });
        const bookRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                booking_type: 'group',
                guests: [{ guest_name: 'Sam' }, { guest_name: 'Riley' }],
                group_event_label: 'Groomsmen party',
                service_ids: [serviceId],
                visit_type: 'shop',
                location: 'At the shop',
                date_text: dateText,
                time_text: '10:00 AM',
                price_at_booking: quote.final_price,
                duration_at_booking: quote.total_duration_minutes,
                context_type: 'independent',
                payment_method: 'online',
                service_name: 'Group Haircut',
                status: 'pending',
            },
        });
        expect(bookRes.statusCode).toBe(200);
        const booking = JSON.parse(bookRes.payload);
        expect(booking.booking_type).toBe('group');
        expect(booking.visit_type).toBe('shop');
        expect(booking.is_group).toBe(true);
        expect(booking.party_size).toBe(2);

        const detailsRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/bookings/${booking.id}/details`,
            headers: authHeaders,
        });
        expect(detailsRes.statusCode).toBe(200);
        const details = JSON.parse(detailsRes.payload);
        expect(details.group_guests).toHaveLength(2);
        expect(details.group_guests.map((g: { guest_name: string }) => g.guest_name)).toEqual([
            'Sam',
            'Riley',
        ]);

        await deleteBookingCascade(booking.id);
        await prisma.shifts.delete({ where: { id: shiftId } });
    }, 60_000);

    it('creates at-home group booking for mobile-only barber', async () => {
        expect(barberId).toBeTruthy();

        const locRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/service-locations',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { offers_shop_service: false, offers_mobile_service: true },
        });
        expect(locRes.statusCode).toBe(200);
        expect(JSON.parse(locRes.payload).mobile_only).toBe(true);

        const { addDays, format } = await import('date-fns');
        const { enUS } = await import('date-fns/locale');
        const bookingDay = addDays(new Date(), 23);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
        const shiftDay = dayNames[bookingDay.getDay()];
        const shiftId = `shift-gb-mobile-ok-${Date.now()}`;
        await prisma.shifts.create({
            data: {
                id: shiftId,
                barber_id: barberId!,
                day: shiftDay,
                start_time: '09:00',
                end_time: '18:00',
            },
        });

        const quoteRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/group-booking/quote',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                service_ids: [serviceId],
                guests: [{ guest_name: 'Casey' }, { guest_name: 'Morgan' }],
                context_type: 'independent',
            },
        });
        expect(quoteRes.statusCode).toBe(200);
        const quote = JSON.parse(quoteRes.payload);

        const bookRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                booking_type: 'group',
                guests: [{ guest_name: 'Casey' }, { guest_name: 'Morgan' }],
                group_event_label: 'At-home groomsmen',
                service_ids: [serviceId],
                visit_type: 'mobile',
                location: '45 Event Street, Athens',
                date_text: format(bookingDay, 'PPP', { locale: enUS }),
                time_text: '2:00 PM',
                price_at_booking: quote.final_price,
                duration_at_booking: quote.total_duration_minutes,
                context_type: 'independent',
                payment_method: 'online',
                service_name: 'Group Haircut',
                status: 'pending',
            },
        });
        expect(bookRes.statusCode).toBe(200);
        const booking = JSON.parse(bookRes.payload);
        expect(booking.visit_type).toBe('mobile');
        expect(booking.location).toMatch(/Event Street/i);

        await deleteBookingCascade(booking.id);
        await prisma.shifts.delete({ where: { id: shiftId } });

        await prisma.barbers.update({
            where: { id: barberId! },
            data: { offers_shop_service: true, offers_mobile_service: false },
        });
    });

    it('rejects at-home group booking for shop-only barber', async () => {
        expect(barberId).toBeTruthy();
        await prisma.barbers.update({
            where: { id: barberId! },
            data: { offers_shop_service: true, offers_mobile_service: false },
        });

        const { addDays, format } = await import('date-fns');
        const { enUS } = await import('date-fns/locale');
        const bookingDay = addDays(new Date(), 22);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
        const shiftDay = dayNames[bookingDay.getDay()];
        const shiftId = `shift-gb-mobile-${Date.now()}`;
        await prisma.shifts.create({
            data: {
                id: shiftId,
                barber_id: barberId!,
                day: shiftDay,
                start_time: '09:00',
                end_time: '18:00',
            },
        });

        const quoteRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/group-booking/quote',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                service_ids: [serviceId],
                guests: [{ guest_name: 'Alex' }, { guest_name: 'Jordan' }],
                context_type: 'independent',
            },
        });
        expect(quoteRes.statusCode).toBe(200);
        const quote = JSON.parse(quoteRes.payload);

        const bookRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                booking_type: 'group',
                guests: [{ guest_name: 'Alex' }, { guest_name: 'Jordan' }],
                service_ids: [serviceId],
                visit_type: 'mobile',
                location: '123 Client Street',
                date_text: format(bookingDay, 'PPP', { locale: enUS }),
                time_text: '11:00 AM',
                price_at_booking: quote.final_price,
                duration_at_booking: quote.total_duration_minutes,
                context_type: 'independent',
                payment_method: 'online',
                service_name: 'Group Haircut',
                status: 'pending',
            },
        });
        expect(bookRes.statusCode).toBe(400);
        expect(JSON.parse(bookRes.payload).error).toMatch(/at-home/i);

        await prisma.shifts.delete({ where: { id: shiftId } });
    });
});

