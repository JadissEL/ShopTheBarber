import { prisma } from '../db/prisma';
import crypto from 'crypto';
import { parse, addMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { sendEmail } from './email';
import { buildBookingConfirmationSms, sendSms } from './sms';
import { validatePromoCode } from './promoCode';
import { calculateBookingQuote } from '../pricing/logic';
import { assertCanAcceptCashBooking } from '../providerWallet/logic';
import {
    assertGroupBookingAllowed,
    calculateGroupBookingQuote,
    persistGroupGuests,
    type GroupGuestInput,
} from '../groupBooking/logic';
import { validateMobileBookingTravel } from '../atHomeService/logic';
import { applyPaymentProtectionToBooking } from '../paymentProtection/checkout';
import { serializeBookingRow } from './bookingSerialize';
import { trackProductEventInternal } from '../productAnalytics/track';
import { validateChairCapacity, getBarberBufferMinutes } from '../domain/capacity/logic';
import { ensureBookingQrToken } from '../domain/booking/qrCheckIn';
import { logger } from '../lib/logger';

function parseTimeString(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export async function validateBooking(params: {
    barber_id: string,
    shop_id?: string,
    start_datetime: Date,
    duration_minutes: number,
    context_type?: string,
    exclude_booking_id?: string,
    chair_id?: string | null,
}) {
    const { barber_id, shop_id, start_datetime, duration_minutes, context_type, exclude_booking_id, chair_id } = params;

    const startTime = start_datetime;
    const bufferMinutes = await getBarberBufferMinutes(barber_id);
    const endTime = addMinutes(startTime, duration_minutes + bufferMinutes);
    const now = new Date();

    if (startTime < now) {
        return { status: 'ERROR', message: 'Cannot book in the past' };
    }

    // Check Shifts
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[startTime.getDay()] as any;

    const relevantShifts = await prisma.shifts.findMany({
        where: {
            barber_id,
            day: dayOfWeek,
            ...(context_type === 'shop' && shop_id ? { shop_id } : {})
        }
    });

    // If generic fallback logic needed (e.g. 9-5 if no shifts), handle it here.
    // For now, strict shift enforcement.
    if (relevantShifts.length === 0) {
        // Warning: This might block bookings if shifts aren't seeded.
        // Returning unavailable for safety.
        return {
            status: 'UNAVAILABLE',
            reason: 'NO_SHIFTS_DEFINED',
            message: `Barber has no shifts on ${dayOfWeek}`
        };
    }

    const shift = relevantShifts[0];
    const shiftStart = parseTimeString(shift.start_time);
    const shiftEnd = parseTimeString(shift.end_time);

    const bookingStartMin = startTime.getHours() * 60 + startTime.getMinutes();
    const bookingEndMin = endTime.getHours() * 60 + endTime.getMinutes();

    if (bookingStartMin < shiftStart || bookingEndMin > shiftEnd) {
        return {
            status: 'UNAVAILABLE',
            reason: 'OUTSIDE_SHIFT_HOURS',
            message: `Booking outside shift hours (${shift.start_time} - ${shift.end_time})`
        };
    }

    // Check Existing Bookings (Overlap) — per chair when shop context, else per barber
    if (shop_id) {
        const chairCheck = await validateChairCapacity({
            shopId: shop_id,
            barberId: barber_id,
            chairId: chair_id,
            startDatetime: startTime,
            durationMinutes: duration_minutes,
            excludeBookingId: exclude_booking_id,
        });
        if (!chairCheck.ok) {
            return { status: 'UNAVAILABLE', reason: 'CHAIR_CONFLICT', message: chairCheck.message };
        }
    }

    const conflictingBookings = await prisma.bookings.findMany({
        where: {
            barber_id,
            status: { notIn: ['cancelled', 'no_show'] },
            start_time: { lt: endTime.toISOString() },
            end_time: { gt: startTime.toISOString() },
            ...(exclude_booking_id ? { id: { not: exclude_booking_id } } : {}),
            ...(shop_id ? {} : {}),
        }
    });

    if (conflictingBookings.length > 0) {
        return {
            status: 'UNAVAILABLE',
            reason: 'BOOKING_CONFLICT',
            message: 'Slot is already taken'
        };
    }

    return { status: 'AVAILABLE' };
}

import {
    getServiceLocationModes,
    getShopBookingLocationModes,
    resolveVisitTypeForBooking,
    assertVisitTypeAllowedForModes,
} from '../lib/serviceLocation';

function resolveVisitType(
    payload: { visit_type?: string; shop_id?: string; context_type?: string },
    barber?: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null,
    shop?: { offers_shop_service?: boolean | null; offers_mobile_service?: boolean | null } | null
): 'shop' | 'mobile' {
    const requested =
        payload.visit_type === 'mobile' ? 'mobile' : payload.visit_type === 'shop' ? 'shop' : undefined;
    const inShopContext = !!payload.shop_id && payload.context_type !== 'independent';
    if (barber) {
        return resolveVisitTypeForBooking(barber, shop, requested, inShopContext);
    }
    return requested === 'mobile' ? 'mobile' : 'shop';
}

async function assertVisitTypeAllowed(
    barberId: string,
    visitType: 'shop' | 'mobile',
    locationText: string | null | undefined,
    shopId?: string | null,
    contextType?: string | null
): Promise<void> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { offers_mobile_service: true, offers_shop_service: true },
    });
    if (!barber) throw new Error('Barber not found');

    const inShopContext = !!shopId && contextType !== 'independent';
    if (inShopContext && shopId) {
        const shop = await prisma.shops.findUnique({
            where: { id: shopId },
            select: { offers_mobile_service: true, offers_shop_service: true },
        });
        if (!shop) throw new Error('Shop not found');
        const modes = getShopBookingLocationModes(barber, shop);
        assertVisitTypeAllowedForModes(modes, visitType, locationText, 'shop');
        return;
    }

    const modes = getServiceLocationModes(barber);
    assertVisitTypeAllowedForModes(modes, visitType, locationText, 'barber');
}

async function notifyProviderOfBooking(params: {
    barberUserId: string | null | undefined;
    bookingId: string;
    isGroup: boolean;
    partySize: number | null;
    visitType: 'shop' | 'mobile';
    locationText: string | null;
    serviceName: string;
    dateText: string;
    timeText: string;
    groupEventLabel?: string | null;
}): Promise<void> {
    if (!params.barberUserId) return;
    const parts: string[] = [];
    if (params.isGroup) {
        const venue =
            params.visitType === 'mobile'
                ? `At-home group (${params.partySize ?? 'multiple'} guests)`
                : `In-shop group (${params.partySize ?? 'multiple'} guests)`;
        parts.push(venue);
        if (params.groupEventLabel) parts.push(params.groupEventLabel);
    } else if (params.visitType === 'mobile') {
        parts.push(`At-home visit${params.locationText ? `: ${params.locationText}` : ''}`);
    }
    const detail = parts.length > 0 ? `, ${parts.join(', ')}` : '';
    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: params.barberUserId,
            title: params.isGroup ? 'New group booking request' : 'New booking request',
            content: `${params.serviceName} on ${params.dateText} at ${params.timeText}${detail}`,
            type: 'booking',
        },
    });
}

export async function createBookingLogic(payload: any) {
    // 1. Parse Date & Time
    let start_time: Date;
    let end_time: Date;

    try {
        // Try parsing PPP (e.g. July 24th, 2024)
        // Note: 'th' is tricky. date-fns PPP usually handles locale specific long dates.
        // Fallback: simple Date parse if PPP fails or format varies.
        const datePart = parse(payload.date_text, 'PPP', new Date(), { locale: enUS });

        // Parse time (3:30 PM)
        const timePart = parse(payload.time_text, 'h:mm a', new Date(), { locale: enUS });

        // Merge
        start_time = new Date(datePart);
        start_time.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);

        if (isNaN(start_time.getTime())) throw new Error("Invalid Date");

        const duration = payload.duration_at_booking || 30;
        end_time = addMinutes(start_time, duration);

    } catch (e) {
        throw new Error(`Invalid date/time format: ${payload.date_text} ${payload.time_text}`);
    }

    // 2. Validate Availability
    const validation = await validateBooking({
        barber_id: payload.barber_id,
        shop_id: payload.shop_id,
        start_datetime: start_time,
        duration_minutes: payload.duration_at_booking || 30,
        context_type: payload.context_type
    });

    if (validation.status !== 'AVAILABLE') {
        throw new Error(validation.message);
    }

    const barberForVisit = await prisma.barbers.findUnique({
        where: { id: payload.barber_id },
        select: { offers_mobile_service: true, offers_shop_service: true },
    });
    if (!barberForVisit) throw new Error('Barber not found');

    const shopForVisit = payload.shop_id
        ? await prisma.shops.findUnique({
              where: { id: payload.shop_id },
              select: { offers_mobile_service: true, offers_shop_service: true },
          })
        : null;

    const visitType = resolveVisitType(payload, barberForVisit, shopForVisit);
    const locationText =
        typeof payload.location === 'string' && payload.location.trim()
            ? payload.location.trim().slice(0, 500)
            : typeof payload.location_text === 'string' && payload.location_text.trim()
              ? payload.location_text.trim().slice(0, 500)
              : null;

    await assertVisitTypeAllowed(
        payload.barber_id,
        visitType,
        locationText,
        payload.shop_id,
        payload.context_type
    );

    let travelQuote = null as Awaited<ReturnType<typeof validateMobileBookingTravel>> | null;
    if (visitType === 'mobile') {
        travelQuote = await validateMobileBookingTravel({
            barberId: payload.barber_id,
            shopId: payload.shop_id ?? null,
            contextType: payload.context_type ?? null,
            address: locationText ?? undefined,
            latitude:
                typeof payload.client_latitude === 'number' ? payload.client_latitude : undefined,
            longitude:
                typeof payload.client_longitude === 'number' ? payload.client_longitude : undefined,
        });
        if (travelQuote) {
            const sentFee =
                typeof payload.travel_fee_amount === 'number' ? payload.travel_fee_amount : 0;
            if (Math.abs(sentFee - travelQuote.travel_fee) > 0.02) {
                throw new Error('Travel fee mismatch; please refresh your booking summary and try again');
            }
        }
    }
    const travelFeeAmount = travelQuote?.travel_fee ?? 0;

    const isGroupBooking = payload.booking_type === 'group';
    let groupQuote: Awaited<ReturnType<typeof calculateGroupBookingQuote>> | null = null;
    let groupGuests: GroupGuestInput[] = [];

    if (isGroupBooking) {
        await assertGroupBookingAllowed(payload.barber_id);
        groupGuests = Array.isArray(payload.guests) ? payload.guests : [];
        if (groupGuests.length === 0) {
            throw new Error('Group booking requires at least one guest');
        }

        const serviceIdsForGroup: string[] = [];
        if (Array.isArray(payload.service_ids)) {
            serviceIdsForGroup.push(...payload.service_ids.filter((id: unknown) => typeof id === 'string'));
        } else if (payload.service_snapshot?.services?.length) {
            for (const s of payload.service_snapshot.services) {
                if (s?.id) serviceIdsForGroup.push(String(s.id));
            }
        }
        if (serviceIdsForGroup.length === 0) {
            throw new Error('Group booking requires at least one service');
        }

        groupQuote = await calculateGroupBookingQuote({
            barber_id: payload.barber_id,
            shop_id: payload.shop_id ?? null,
            shop_member_id: payload.shop_member_id ?? null,
            user_id: payload.client_id,
            promo_code:
                (typeof payload.discount_code === 'string' && payload.discount_code.trim()) ||
                (typeof payload.promo_code === 'string' && payload.promo_code.trim()) ||
                null,
            context_type: payload.context_type ?? (payload.shop_id ? 'shop' : 'independent'),
            service_ids: serviceIdsForGroup,
            guests: groupGuests,
            group_event_label: payload.group_event_label ?? null,
        });

        const expectedFinal = groupQuote.final_price + travelFeeAmount;
        const got = payload.price_at_booking;
        if (typeof got !== 'number' || Number.isNaN(got) || Math.abs(got - expectedFinal) > 0.02) {
            throw new Error('Price mismatch; please refresh your group booking summary and try again');
        }

        const expectedDuration = groupQuote.total_duration_minutes;
        const gotDuration = payload.duration_at_booking;
        if (typeof gotDuration === 'number' && gotDuration !== expectedDuration) {
            throw new Error('Duration mismatch; please refresh and try again');
        }

        end_time = addMinutes(start_time, expectedDuration);
        const revalidation = await validateBooking({
            barber_id: payload.barber_id,
            shop_id: payload.shop_id,
            start_datetime: start_time,
            duration_minutes: expectedDuration,
            context_type: payload.context_type,
        });
        if (revalidation.status !== 'AVAILABLE') {
            throw new Error(revalidation.message);
        }
    }

    const rawPromo =
        (typeof payload.discount_code === 'string' && payload.discount_code.trim() && payload.discount_code) ||
        (typeof payload.promo_code === 'string' && payload.promo_code.trim() && payload.promo_code) ||
        '';

    const serviceIds: string[] = [];
    if (Array.isArray(payload.service_ids)) {
        serviceIds.push(...payload.service_ids.filter((id: unknown) => typeof id === 'string'));
    } else if (payload.service_snapshot?.services?.length) {
        for (const s of payload.service_snapshot.services) {
            if (s?.id) serviceIds.push(String(s.id));
        }
    }

    let quote: Awaited<ReturnType<typeof calculateBookingQuote>> | null = null;
    if (!isGroupBooking && serviceIds.length > 0) {
        quote = await calculateBookingQuote({
            service_ids: serviceIds,
            barber_id: payload.barber_id,
            shop_id: payload.shop_id ?? null,
            shop_member_id: payload.shop_member_id ?? null,
            user_id: payload.client_id,
            promo_code: rawPromo || null,
            context_type: payload.shop_id ? 'shop' : 'independent',
        });

        const expectedFinal = quote.final_price + travelFeeAmount;
        const got = payload.price_at_booking;
        if (typeof got !== 'number' || Number.isNaN(got) || Math.abs(got - expectedFinal) > 0.02) {
            throw new Error('Price mismatch; please refresh your booking summary and try again');
        }

        if (typeof payload.duration_at_booking === 'number' && payload.duration_at_booking !== quote.total_duration_minutes) {
            throw new Error('Duration mismatch; please refresh and try again');
        }
    }

    const discount_code_norm = rawPromo ? rawPromo.trim().toUpperCase() : null;

    if (discount_code_norm && !quote && !groupQuote) {
        let fb: unknown = payload.financial_breakdown;
        if (typeof fb === 'string') {
            try {
                fb = JSON.parse(fb);
            } catch {
                fb = null;
            }
        }
        const baseForPromo =
            fb && typeof fb === 'object' && typeof (fb as { base_price?: unknown }).base_price === 'number'
                ? (fb as { base_price: number }).base_price
                : typeof payload.service_snapshot?.base_price === 'number'
                  ? payload.service_snapshot.base_price
                  : null;

        if (baseForPromo == null || !Number.isFinite(baseForPromo)) {
            throw new Error('Cannot apply promo: missing booking subtotal');
        }
        const v = await validatePromoCode({
            code: discount_code_norm,
            barber_id: payload.barber_id,
            shop_id: payload.shop_id ?? null,
            base_price: baseForPromo,
            user_id: payload.client_id,
            context_type: payload.shop_id ? 'shop' : 'independent',
            skip_audit: false,
        });
        if (v.status !== 'VALID') throw new Error(v.message);
        const expectedFinal = v.final_price ?? Math.max(0, baseForPromo - (v.discount_amount ?? 0));
        const got = payload.price_at_booking;
        if (typeof got !== 'number' || Number.isNaN(got) || Math.abs(got - expectedFinal) > 0.02) {
            throw new Error('Price mismatch for applied promo; please refresh and try again');
        }
    }

    // 3. Cash-at-store validation
    const paymentMethod = payload.payment_method === 'cash_at_store' ? 'cash_at_store' : 'online';
    let platformFeeStatus = 'not_applicable';
    let platformFeeAmount: number | null = null;

    if (paymentMethod === 'cash_at_store') {
        const price = payload.price_at_booking ?? 0;
        const cashCheck = await assertCanAcceptCashBooking(payload.barber_id, payload.shop_id ?? null, price);
        platformFeeStatus = 'pending';
        platformFeeAmount = cashCheck.platform_fee;
    }

    // 4. Resolve chair for shop bookings
    let resolvedChairId: string | null = null;
    if (payload.shop_id) {
        const chairCheck = await validateChairCapacity({
            shopId: payload.shop_id,
            barberId: payload.barber_id,
            chairId: payload.chair_id ?? null,
            startDatetime: start_time,
            durationMinutes: payload.duration_at_booking || 30,
        });
        if (!chairCheck.ok) throw new Error(chairCheck.message);
        resolvedChairId = chairCheck.chair_id;
    }

    // 5. Insert Booking
    const booking = await prisma.bookings.create({
        data: {
            id: crypto.randomUUID(),
            client_id: payload.client_id,
            barber_id: payload.barber_id,
            shop_id: payload.shop_id,
            chair_id: resolvedChairId,
            client_name: payload.client_name ?? null,
            client_phone: payload.client_phone ?? null,
            client_email: payload.client_email ?? null,
            guest_access_token: payload.guest_access_token ?? null,
            barber_name: payload.barber_name ?? null,
            service_name: payload.service_name ?? null,
            start_time: start_time.toISOString(),
            end_time: end_time.toISOString(),
            status: payload.status || 'pending',
            payment_status: paymentMethod === 'cash_at_store' ? 'unpaid' : (payload.payment_status || 'unpaid'),
            payment_method: paymentMethod,
            platform_fee_status: platformFeeStatus,
            platform_fee_amount: platformFeeAmount,
            financial_breakdown: JSON.stringify(payload.financial_breakdown),
            price_at_booking: payload.price_at_booking,
            notes: payload.customer_notes,
            discount_code: discount_code_norm,
            booking_type: isGroupBooking ? 'group' : 'individual',
            party_size: isGroupBooking ? groupQuote?.party_size ?? groupGuests.length : null,
            group_event_label:
                isGroupBooking && typeof payload.group_event_label === 'string'
                    ? payload.group_event_label.trim().slice(0, 200) || null
                    : null,
            group_notes:
                isGroupBooking && typeof payload.group_notes === 'string'
                    ? payload.group_notes.trim().slice(0, 1000) || null
                    : null,
            visit_type: visitType,
            location_text: travelQuote?.formatted_address ?? locationText,
            client_latitude: travelQuote?.client_latitude ?? payload.client_latitude ?? null,
            client_longitude: travelQuote?.client_longitude ?? payload.client_longitude ?? null,
            travel_distance_km: travelQuote?.distance_km ?? null,
            travel_fee_amount: travelFeeAmount > 0 ? travelFeeAmount : null,
            travel_zone_label: travelQuote?.zone_label ?? null,
            date_text: payload.date_text ?? null,
            time_text: payload.time_text ?? null,
            service_snapshot: payload.service_snapshot
                ? JSON.stringify(payload.service_snapshot)
                : null,
        }
    });

    if (isGroupBooking && groupGuests.length > 0) {
        await persistGroupGuests(booking.id, groupGuests, groupQuote?.guests);
        const guestServiceIds = new Set<string>();
        if (groupQuote?.guests) {
            for (const line of groupQuote.guests) {
                for (const sid of line.service_ids) guestServiceIds.add(sid);
            }
        }
        for (const serviceId of guestServiceIds) {
            await prisma.booking_services.create({
                data: { booking_id: booking.id, service_id: serviceId },
            });
        }
    } else if (serviceIds.length > 0) {
        for (const serviceId of serviceIds) {
            await prisma.booking_services.create({
                data: { booking_id: booking.id, service_id: serviceId },
            });
        }
    } else if (payload.service_snapshot?.services?.length) {
        for (const s of payload.service_snapshot.services) {
            if (s?.id) {
                await prisma.booking_services.create({
                    data: { booking_id: booking.id, service_id: String(s.id) },
                });
            }
        }
    }

    // 5. Fetch Client & Barber Details for Email
    const client = payload.client_id
        ? await prisma.users.findUnique({
              where: { id: payload.client_id },
              select: { email: true, full_name: true, phone: true, sms_reminders_enabled: true },
          })
        : null;
    const barber = await prisma.barbers.findUnique({ where: { id: payload.barber_id } });

    const guestEmail = payload.client_email?.trim() || null;
    const guestPhone = payload.client_phone?.trim() || null;
    const guestName = payload.client_name?.trim() || 'Guest';

    // 6. Send Confirmation Email + optional SMS
    const recipientEmail = client?.email ?? guestEmail;
    const recipientName = client?.full_name ?? guestName;

    if (recipientEmail) {
        sendEmail({
            to: recipientEmail,
            subject: `Booking Confirmed! 💈`,
            template: 'confirmation',
            data: {
                clientName: recipientName,
                barberName: barber?.name || 'Your Barber',
                date: payload.date_text,
                time: payload.time_text,
                serviceName: isGroupBooking
                    ? `Group (${groupQuote?.party_size ?? groupGuests.length} guests)`
                    : payload.service_snapshot?.services?.[0]?.name || 'Barber Service',
                location: locationText || (visitType === 'mobile' ? 'At your location' : 'At the Shop'),
                price: `${payload.price_at_booking} EUR`
            }
        }).catch(() => { /* email failure is non-blocking */ });
    }

    const barberUserId = barber?.user_id ?? null;
    await notifyProviderOfBooking({
        barberUserId,
        bookingId: booking.id,
        isGroup: isGroupBooking,
        partySize: isGroupBooking ? groupQuote?.party_size ?? groupGuests.length : null,
        visitType,
        locationText,
        serviceName: isGroupBooking
            ? `Group (${groupQuote?.party_size ?? groupGuests.length} guests)`
            : payload.service_name || payload.service_snapshot?.services?.[0]?.name || 'Appointment',
        dateText: payload.date_text,
        timeText: payload.time_text,
        groupEventLabel: isGroupBooking ? payload.group_event_label : null,
    }).catch(() => { /* non-blocking */ });

    if (client?.phone && client.sms_reminders_enabled !== false) {
        const serviceLabel = isGroupBooking
            ? `Group (${groupQuote?.party_size ?? groupGuests.length} guests)`
            : payload.service_snapshot?.services?.[0]?.name || 'Barber Service';
        sendSms(
            client.phone,
            buildBookingConfirmationSms({
                barberName: barber?.name || 'your barber',
                dateText: payload.date_text,
                timeText: payload.time_text,
                serviceName: serviceLabel,
            })
        ).catch(() => { /* non-blocking */ });
    } else if (guestPhone) {
        const serviceLabel = isGroupBooking
            ? `Group (${groupQuote?.party_size ?? groupGuests.length} guests)`
            : payload.service_snapshot?.services?.[0]?.name || 'Barber Service';
        sendSms(
            guestPhone,
            buildBookingConfirmationSms({
                barberName: barber?.name || 'your barber',
                dateText: payload.date_text,
                timeText: payload.time_text,
                serviceName: serviceLabel,
            })
        ).catch(() => { /* non-blocking */ });
    }

    if (payload.client_id) {
        try {
            await applyPaymentProtectionToBooking(
                booking.id,
                payload.barber_id,
                payload.shop_id ?? null,
                payload.price_at_booking ?? 0,
                paymentMethod,
                payload.client_id
            );
        } catch (err) {
            logger.warn('[booking] payment protection failed', {
                bookingId: booking.id,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    if (['confirmed', 'pending'].includes(booking.status || '')) {
        await ensureBookingQrToken(booking.id).catch(() => { /* non-blocking */ });
    }

    const finalRow =
        (await prisma.bookings.findUnique({ where: { id: booking.id } })) ?? booking;

    trackProductEventInternal({
        event_name: 'booking_created',
        user_id: payload.client_id ?? null,
        properties: {
            booking_id: booking.id,
            barber_id: payload.barber_id,
            shop_id: payload.shop_id ?? null,
            price: payload.price_at_booking ?? 0,
            visit_type: visitType,
        },
    });

    return serializeBookingRow(finalRow);
}
